import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    school: { findUnique: vi.fn() },
    student: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    parentStudent: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mailer', () => ({
  sendInvitationEmail: vi.fn(),
}));

vi.mock('@/lib/n8n', () => ({
  sendWhatsAppInvitation: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { claimInvitation, pickChannel, syntheticEmailFromPhone } from '@/lib/invitations';

type Mock = ReturnType<typeof vi.fn>;

const signUpEmail = auth.api.signUpEmail as unknown as Mock;
const signInEmail = auth.api.signInEmail as unknown as Mock;

const invitationFindUnique = prisma.invitation.findUnique as unknown as Mock;
const invitationFindFirst = prisma.invitation.findFirst as unknown as Mock;
const schoolFindUnique = prisma.school.findUnique as unknown as Mock;
const studentFindMany = prisma.student.findMany as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const $transaction = prisma.$transaction as unknown as Mock;

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

function baseInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv1',
    schoolId: 'school1',
    token: 'tok123',
    channel: 'EMAIL',
    contactValue: 'Papa@Mail.com',
    recipientName: 'Papá Uno',
    studentIds: ['st1', 'st2'],
    status: 'SENT',
    expiresAt: FUTURE,
    ...overrides,
  };
}

// tx mock que registra las operaciones dentro de la transacción
function makeTx(claimCount = 1) {
  return {
    invitation: { updateMany: vi.fn().mockResolvedValue({ count: claimCount }) },
    user: { update: vi.fn().mockResolvedValue({}) },
    parentStudent: { upsert: vi.fn().mockResolvedValue({}) },
  };
}

function userAlreadyExistsError() {
  const err = new Error('User already exists. Use another email.') as Error & {
    body?: { code?: string };
  };
  err.body = { code: 'USER_ALREADY_EXISTS' };
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
  schoolFindUnique.mockResolvedValue({ country: 'MX' });
  studentFindMany.mockResolvedValue([{ id: 'st1' }, { id: 'st2' }]);
  invitationFindFirst.mockResolvedValue(null); // sin claim previo del usuario
});

describe('claimInvitation — guards', () => {
  it('token inexistente → INVITATION_NOT_FOUND', async () => {
    invitationFindUnique.mockResolvedValue(null);
    await expect(
      claimInvitation({ token: 'nope', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('INVITATION_NOT_FOUND');
  });

  it('invitación ya claimeada → INVITATION_ALREADY_USED', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation({ status: 'CLAIMED' }));
    await expect(
      claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('INVITATION_ALREADY_USED');
  });

  it('invitación vencida → INVITATION_EXPIRED', async () => {
    invitationFindUnique.mockResolvedValue(
      baseInvitation({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(
      claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('INVITATION_EXPIRED');
  });

  it('teléfono inválido para el país de la escuela → PHONE_INVALID', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    await expect(
      claimInvitation({
        token: 'tok123',
        password: 'x'.repeat(8),
        name: 'P',
        phoneE164: '+15209095510', // US en escuela MX
      }),
    ).rejects.toThrow('PHONE_INVALID');
    expect(signUpEmail).not.toHaveBeenCalled();
  });
});

describe('claimInvitation — camino feliz', () => {
  it('crea usuario, vincula solo alumnos existentes y marca CLAIMED con atribución', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    // st2 fue borrado después de enviar la invitación: NO debe intentar vincularlo
    studentFindMany.mockResolvedValue([{ id: 'st1' }]);
    signUpEmail.mockResolvedValue({
      headers: new Headers({ 'set-cookie': 'ba=1' }),
      response: { token: 'sess1', user: { id: 'u1' } },
    });
    const tx = makeTx();
    $transaction.mockImplementation(async (fn: (_t: unknown) => Promise<unknown>) => fn(tx));

    const result = await claimInvitation({
      token: 'tok123',
      password: 'x'.repeat(8),
      name: 'Papá Uno',
    });

    // email SIEMPRE en minúsculas (better-auth lo normaliza al autenticar)
    expect(signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ email: 'papa@mail.com' }),
      }),
    );
    expect(tx.parentStudent.upsert).toHaveBeenCalledTimes(1);
    expect(tx.parentStudent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { parentId: 'u1', studentId: 'st1' },
      }),
    );
    expect(tx.invitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv1', status: { in: ['PENDING', 'SENT'] } },
        data: expect.objectContaining({ status: 'CLAIMED', claimedByUserId: 'u1' }),
      }),
    );
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'parent', schoolId: 'school1' }),
      }),
    );
    expect(result).toMatchObject({
      userId: 'u1',
      schoolId: 'school1',
      sessionToken: 'sess1',
      setCookie: 'ba=1',
    });
  });

  it('canal WHATSAPP usa el email sintético y hereda el teléfono del contacto', async () => {
    invitationFindUnique.mockResolvedValue(
      baseInvitation({ channel: 'WHATSAPP', contactValue: '+524433683184' }),
    );
    signUpEmail.mockResolvedValue({
      headers: new Headers(),
      response: { token: 't', user: { id: 'u2' } },
    });
    const tx = makeTx();
    $transaction.mockImplementation(async (fn: (_t: unknown) => Promise<unknown>) => fn(tx));

    await claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' });

    expect(signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: '524433683184@whatsapp.eez4us.local',
          phoneE164: '+524433683184',
        }),
      }),
    );
  });
});

describe('claimInvitation — cuenta existente (segunda invitación / claim a medias)', () => {
  it('con la contraseña correcta vincula alumnos a la cuenta existente', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    signUpEmail.mockRejectedValue(userAlreadyExistsError());
    userFindUnique.mockResolvedValue({ id: 'u9', role: 'parent', active: true });
    signInEmail.mockResolvedValue({
      headers: new Headers({ 'set-cookie': 'ba=2' }),
      response: { token: 'sess9' },
    });
    const tx = makeTx();
    $transaction.mockImplementation(async (fn: (_t: unknown) => Promise<unknown>) => fn(tx));

    const result = await claimInvitation({
      token: 'tok123',
      password: 'x'.repeat(8),
      name: 'P',
    });

    expect(signInEmail).toHaveBeenCalled();
    expect(result.userId).toBe('u9');
    expect(tx.parentStudent.upsert).toHaveBeenCalledTimes(2);
  });

  it('con contraseña incorrecta → EMAIL_ALREADY_REGISTERED (sin tocar la invitación)', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    signUpEmail.mockRejectedValue(userAlreadyExistsError());
    userFindUnique.mockResolvedValue({ id: 'u9', role: 'parent', active: true });
    signInEmail.mockRejectedValue(new Error('invalid credentials'));

    await expect(
      claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('EMAIL_ALREADY_REGISTERED');
    expect($transaction).not.toHaveBeenCalled();
  });

  it('cuenta existente de staff/director NUNCA se re-rolea a parent', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    signUpEmail.mockRejectedValue(userAlreadyExistsError());
    userFindUnique.mockResolvedValue({ id: 'd1', role: 'director', active: true });

    await expect(
      claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('EMAIL_ALREADY_REGISTERED');
    expect(signInEmail).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it('si el usuario ya claimeó otra invitación, la segunda se marca sin atribución (claimedByUserId es unique)', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    invitationFindFirst.mockResolvedValue({ id: 'invPrevio' });
    signUpEmail.mockRejectedValue(userAlreadyExistsError());
    userFindUnique.mockResolvedValue({ id: 'u9', role: 'parent', active: true });
    signInEmail.mockResolvedValue({ headers: new Headers(), response: { token: 't' } });
    const tx = makeTx();
    $transaction.mockImplementation(async (fn: (_t: unknown) => Promise<unknown>) => fn(tx));

    await claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' });

    const updateArg = tx.invitation.updateMany.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(updateArg.data.status).toBe('CLAIMED');
    expect('claimedByUserId' in updateArg.data).toBe(false);
  });
});

describe('claimInvitation — carrera de doble claim', () => {
  it('si otro request claimeó entre el check y la transacción → INVITATION_ALREADY_USED', async () => {
    invitationFindUnique.mockResolvedValue(baseInvitation());
    signUpEmail.mockResolvedValue({
      headers: new Headers(),
      response: { token: 't', user: { id: 'u1' } },
    });
    const tx = makeTx(0); // updateMany count 0: otro request ganó
    $transaction.mockImplementation(async (fn: (_t: unknown) => Promise<unknown>) => fn(tx));

    await expect(
      claimInvitation({ token: 'tok123', password: 'x'.repeat(8), name: 'P' }),
    ).rejects.toThrow('INVITATION_ALREADY_USED');
  });
});

describe('helpers', () => {
  it('pickChannel prioriza email sobre whatsapp', () => {
    expect(pickChannel({ email: 'a@b.c', phoneE164: '+52123' })).toBe('EMAIL');
    expect(pickChannel({ email: '  ', phoneE164: '+52123' })).toBe('WHATSAPP');
    expect(pickChannel({ email: null, phoneE164: null })).toBeNull();
  });

  it('syntheticEmailFromPhone deja solo dígitos', () => {
    expect(syntheticEmailFromPhone('+52 443-368-3184')).toBe(
      '524433683184@whatsapp.eez4us.local',
    );
  });
});
