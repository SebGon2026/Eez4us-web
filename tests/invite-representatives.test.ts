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
  auth: { api: { signUpEmail: vi.fn(), signInEmail: vi.fn() } },
}));

vi.mock('@/lib/mailer', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/n8n', () => ({
  sendWhatsAppInvitation: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/db';
import { inviteRepresentatives } from '@/lib/invitations';
import { sendInvitationEmail } from '@/lib/mailer';

type Mock = ReturnType<typeof vi.fn>;

const schoolFindUnique = prisma.school.findUnique as unknown as Mock;
const userFindUnique = prisma.user.findUnique as unknown as Mock;
const invitationFindFirst = prisma.invitation.findFirst as unknown as Mock;
const invitationCreate = prisma.invitation.create as unknown as Mock;
const invitationUpdate = prisma.invitation.update as unknown as Mock;
const parentStudentUpsert = prisma.parentStudent.upsert as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  schoolFindUnique.mockResolvedValue({ country: 'MX' });
  userFindUnique.mockResolvedValue(null);
  invitationFindFirst.mockResolvedValue(null);
  invitationUpdate.mockResolvedValue({});
  invitationCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'invNew',
    token: 'tokNew',
    contactValue: data.contactValue,
    ...data,
  }));
});

const REP = {
  firstName: 'Carla',
  lastName: 'Pérez',
  email: 'Carla@Mail.com',
  phoneE164: null,
};

describe('inviteRepresentatives', () => {
  it('contacto ya registrado como padre de la escuela → vincula alumnos directo, sin invitación', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      role: 'parent',
      active: true,
      schoolId: 'school1',
    });

    const result = await inviteRepresentatives({
      schoolId: 'school1',
      studentIds: ['st1', 'st2'],
      studentNames: ['Luis Pérez', 'Ana Pérez'],
      representatives: [REP],
    });

    expect(result.linkedCount).toBe(1);
    expect(result.createdCount).toBe(0);
    expect(parentStudentUpsert).toHaveBeenCalledTimes(2);
    expect(invitationCreate).not.toHaveBeenCalled();
    expect(sendInvitationEmail).not.toHaveBeenCalled();
  });

  it('invitación viva del mismo contacto → suma alumnos y reenvía, sin duplicar', async () => {
    invitationFindFirst.mockResolvedValue({
      id: 'invLive',
      token: 'tokLive',
      studentIds: ['st1'],
      recipientName: 'Carla Pérez',
      channel: 'EMAIL',
    });

    const result = await inviteRepresentatives({
      schoolId: 'school1',
      studentIds: ['st2'],
      studentNames: ['Ana Pérez'],
      representatives: [REP],
    });

    expect(result.mergedCount).toBe(1);
    expect(result.createdCount).toBe(0);
    expect(invitationCreate).not.toHaveBeenCalled();
    const updateArg = invitationUpdate.mock.calls[0][0] as {
      data: { studentIds: string[] };
    };
    expect(updateArg.data.studentIds.sort()).toEqual(['st1', 'st2']);
    expect(sendInvitationEmail).toHaveBeenCalledTimes(1);
  });

  it('contacto nuevo → crea invitación y la envía', async () => {
    const result = await inviteRepresentatives({
      schoolId: 'school1',
      studentIds: ['st1'],
      studentNames: ['Luis Pérez'],
      representatives: [REP],
    });

    expect(result.createdCount).toBe(1);
    expect(result.sentCount).toBe(1);
    expect(invitationCreate).toHaveBeenCalledTimes(1);
    expect(sendInvitationEmail).toHaveBeenCalledTimes(1);
  });

  it('rep sin contacto → repError REP_NEEDS_CONTACT', async () => {
    const result = await inviteRepresentatives({
      schoolId: 'school1',
      studentIds: ['st1'],
      studentNames: ['Luis'],
      representatives: [{ firstName: 'X', lastName: 'Y', email: null, phoneE164: null }],
    });
    expect(result.repErrors).toEqual([{ rep: 'X Y', reason: 'REP_NEEDS_CONTACT' }]);
    expect(result.createdCount).toBe(0);
  });

  it('canal whatsapp con teléfono de otro país → PHONE_INVALID', async () => {
    const result = await inviteRepresentatives({
      schoolId: 'school1',
      studentIds: ['st1'],
      studentNames: ['Luis'],
      representatives: [
        { firstName: 'X', lastName: 'Y', email: null, phoneE164: '+15209095510' },
      ],
    });
    expect(result.repErrors).toEqual([{ rep: 'X Y', reason: 'PHONE_INVALID' }]);
  });
});
