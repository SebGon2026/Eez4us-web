import type { Invitation, InvitationChannel } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';

import { appBaseUrl } from './app-url';
import { auth } from './auth';
import { prisma } from './db';
import { type AppLocale,localeForCountry } from './locale';
import { sendInvitationEmail } from './mailer';
import { sendWhatsAppInvitation } from './n8n';
import { validatePhoneForCountry } from './phone';

const TOKEN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateToken = customAlphabet(TOKEN_ALPHABET, 24);

const DEFAULT_EXPIRY_DAYS = 14;

const nullableEmail = z
  .string()
  .trim()
  .email()
  .max(160)
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null));

const nullablePhone = z
  .string()
  .trim()
  .min(5)
  .max(20)
  .nullable()
  .optional()
  .or(z.literal('').transform(() => null));

export const representativeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: nullableEmail,
    phoneE164: nullablePhone,
  })
  .refine((r) => Boolean(r.email) || Boolean(r.phoneE164), {
    message: 'REP_NEEDS_CONTACT',
  });

export type RepresentativeInput = z.infer<typeof representativeSchema>;

export interface CreateInvitationArgs {
  schoolId: string;
  parent: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phoneE164?: string | null;
  };
  studentIds: string[];
  channel: InvitationChannel;
  expiresInDays?: number;
}

export async function createInvitation({
  schoolId,
  parent,
  studentIds,
  channel,
  expiresInDays = DEFAULT_EXPIRY_DAYS,
}: CreateInvitationArgs): Promise<Invitation> {
  const contactValue = channel === 'EMAIL' ? parent.email : parent.phoneE164;
  if (!contactValue) {
    throw new Error(
      `createInvitation: missing ${channel === 'EMAIL' ? 'email' : 'phoneE164'} for ${parent.firstName} ${parent.lastName}`,
    );
  }

  const recipientName = `${parent.firstName} ${parent.lastName}`.trim();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  return prisma.invitation.create({
    data: {
      schoolId,
      token: generateToken(),
      channel,
      contactValue,
      recipientName: recipientName || null,
      studentIds,
      expiresAt,
    },
  });
}

export function pickChannel(contact: {
  email?: string | null;
  phoneE164?: string | null;
}): InvitationChannel | null {
  if (contact.email && contact.email.trim()) return 'EMAIL';
  if (contact.phoneE164 && contact.phoneE164.trim()) return 'WHATSAPP';
  return null;
}

export function inviteLink(token: string): string {
  return `${appBaseUrl()}/invite/${token}`;
}

interface DispatchInvitationArgs {
  channel: InvitationChannel;
  contactValue: string;
  link: string;
  parentName: string;
  studentNames: string[];
  // Idioma del email según país del colegio. WhatsApp no lo usa: el template vive en Meta/n8n.
  locale?: AppLocale;
}

export async function dispatchInvitation({
  channel,
  contactValue,
  link,
  parentName,
  studentNames,
  locale,
}: DispatchInvitationArgs): Promise<void> {
  if (channel === 'EMAIL') {
    await sendInvitationEmail({ email: contactValue, link, parentName, studentNames, locale });
  } else {
    await sendWhatsAppInvitation({ phone: contactValue, link, parentName, studentNames });
  }
}

interface SendInvitationArgs {
  invitationId: string;
  channel: InvitationChannel;
  contactValue: string;
  token: string;
  parentName: string;
  studentNames: string[];
  locale?: AppLocale;
}

export async function sendInvitation({
  invitationId,
  channel,
  contactValue,
  token,
  parentName,
  studentNames,
  locale,
}: SendInvitationArgs): Promise<void> {
  await dispatchInvitation({
    channel,
    contactValue,
    link: inviteLink(token),
    parentName,
    studentNames,
    locale,
  });
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'SENT', sentAt: new Date() },
  });
}

export interface InviteRepresentativesResult {
  createdCount: number;
  sentCount: number;
  // Contacto que ya tiene cuenta de padre en ESTA escuela: se vinculan los alumnos directo
  // (sin invitación). Contacto con invitación viva: se le suman los alumnos (sin duplicar).
  linkedCount: number;
  mergedCount: number;
  repErrors: Array<{ rep: string; reason: string }>;
}

export async function inviteRepresentatives({
  schoolId,
  studentIds,
  studentNames,
  representatives,
}: {
  schoolId: string;
  studentIds: string[];
  studentNames: string[];
  representatives: RepresentativeInput[];
}): Promise<InviteRepresentativesResult> {
  const repErrors: Array<{ rep: string; reason: string }> = [];
  const toSend: Array<{
    invitationId: string;
    channel: InvitationChannel;
    contactValue: string;
    token: string;
    parentName: string;
  }> = [];
  let createdCount = 0;
  let linkedCount = 0;
  let mergedCount = 0;

  // País de la escuela: valida el teléfono por prefijo+longitud (E.164 si es
  // desconocido) y decide el idioma del email de invitación.
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { country: true },
  });
  const locale = localeForCountry(school?.country);

  for (const rep of representatives) {
    const repName = `${rep.firstName} ${rep.lastName}`.trim();
    const channel = pickChannel(rep);
    if (!channel) {
      repErrors.push({ rep: repName, reason: 'REP_NEEDS_CONTACT' });
      continue;
    }
    // El email tiene prioridad: un email válido NO se bloquea por un teléfono con prefijo de
    // otro país. Solo validamos el teléfono cuando ES el canal a usar (WhatsApp, o sea sin email).
    if (channel === 'WHATSAPP' && !validatePhoneForCountry(rep.phoneE164 ?? '', school?.country).valid) {
      repErrors.push({ rep: repName, reason: 'PHONE_INVALID' });
      continue;
    }
    const contactValue = (channel === 'EMAIL' ? rep.email : rep.phoneE164) as string;
    try {
      // Contacto que YA es padre registrado de esta escuela (mismo email de login que usaría
      // el claim): vincular los alumnos directo. Invitarlo de nuevo era un callejón sin
      // salida — el claim moría en "email ya registrado".
      const loginEmail =
        channel === 'EMAIL' ? contactValue.toLowerCase() : syntheticEmailFromPhone(contactValue);
      const existingUser = await prisma.user.findUnique({
        where: { email: loginEmail },
        select: { id: true, role: true, schoolId: true, active: true },
      });
      if (
        existingUser &&
        existingUser.role === 'parent' &&
        existingUser.active &&
        existingUser.schoolId === schoolId
      ) {
        for (const studentId of studentIds) {
          await prisma.parentStudent.upsert({
            where: { parentId_studentId: { parentId: existingUser.id, studentId } },
            create: { parentId: existingUser.id, studentId },
            update: {},
          });
        }
        linkedCount += 1;
        continue;
      }

      // Invitación viva para el mismo contacto: sumarle los alumnos en vez de duplicar, y
      // reenviar el link existente para avisarle del alumno nuevo.
      const live = await prisma.invitation.findFirst({
        where: {
          schoolId,
          contactValue: { equals: contactValue, mode: 'insensitive' },
          status: { in: ['PENDING', 'SENT'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, token: true, studentIds: true, recipientName: true, channel: true },
      });
      if (live) {
        const mergedIds = [...new Set([...live.studentIds, ...studentIds])];
        await prisma.invitation.update({
          where: { id: live.id },
          data: {
            studentIds: mergedIds,
            recipientName: live.recipientName ?? (repName || null),
            expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
          },
        });
        mergedCount += 1;
        toSend.push({
          invitationId: live.id,
          channel: live.channel,
          contactValue,
          token: live.token,
          parentName: repName,
        });
        continue;
      }

      const invitation = await createInvitation({
        schoolId,
        parent: {
          firstName: rep.firstName,
          lastName: rep.lastName,
          email: rep.email ?? null,
          phoneE164: rep.phoneE164 ?? null,
        },
        studentIds,
        channel,
      });
      createdCount += 1;
      toSend.push({
        invitationId: invitation.id,
        channel,
        contactValue: invitation.contactValue,
        token: invitation.token,
        parentName: repName,
      });
    } catch (err) {
      repErrors.push({ rep: repName, reason: err instanceof Error ? err.message : 'unknown' });
    }
  }

  const sendResults = await Promise.allSettled(
    toSend.map((c) =>
      sendInvitation({
        invitationId: c.invitationId,
        channel: c.channel,
        contactValue: c.contactValue,
        token: c.token,
        parentName: c.parentName,
        studentNames,
        locale,
      }),
    ),
  );
  sendResults.forEach((r, i) => {
    if (r.status === 'rejected') {
      repErrors.push({ rep: toSend[i].parentName, reason: `send: ${String(r.reason)}` });
    }
  });

  return {
    createdCount,
    linkedCount,
    mergedCount,
    sentCount: sendResults.filter((r) => r.status === 'fulfilled').length,
    repErrors,
  };
}

export interface ClaimInvitationArgs {
  token: string;
  password: string;
  name: string;
  phoneE164?: string | null;
}

export interface ClaimInvitationResult {
  userId: string;
  schoolId: string;
  sessionToken: string | null;
  setCookie: string | null;
}

export function syntheticEmailFromPhone(phoneE164: string): string {
  return `${phoneE164.replace(/[^\d]/g, '')}@whatsapp.eez4us.local`;
}

// better-auth tira APIError con body.code USER_ALREADY_EXISTS; el fallback por mensaje
// cubre cambios de shape entre versiones.
function isUserAlreadyExistsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { body?: { code?: string }; message?: string };
  if (e.body?.code === 'USER_ALREADY_EXISTS') return true;
  return (e.message ?? '').toLowerCase().includes('already exists');
}

interface AuthResponseShape {
  headers?: unknown;
  response?: { token?: string | null; user?: { id?: string } } | null;
}

function extractAuthResult(res: AuthResponseShape): {
  setCookie: string | null;
  sessionToken: string | null;
  userId: string | null;
} {
  return {
    setCookie:
      (res.headers instanceof Headers ? res.headers.get('set-cookie') : null) ?? null,
    sessionToken: res.response?.token ?? null,
    userId: res.response?.user?.id ?? null,
  };
}

export async function claimInvitation({
  token,
  password,
  name,
  phoneE164,
}: ClaimInvitationArgs): Promise<ClaimInvitationResult> {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) {
    throw new Error('INVITATION_NOT_FOUND');
  }
  if (invitation.status !== 'PENDING' && invitation.status !== 'SENT') {
    throw new Error('INVITATION_ALREADY_USED');
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw new Error('INVITATION_EXPIRED');
  }

  // El padre puede tipear su teléfono al claimear: validarlo contra el país de la escuela.
  if (phoneE164) {
    const school = await prisma.school.findUnique({
      where: { id: invitation.schoolId },
      select: { country: true },
    });
    if (!validatePhoneForCountry(phoneE164, school?.country).valid) {
      throw new Error('PHONE_INVALID');
    }
  }

  const email = (
    invitation.channel === 'EMAIL'
      ? invitation.contactValue
      : syntheticEmailFromPhone(invitation.contactValue)
  ).toLowerCase();

  const phone =
    phoneE164 ?? (invitation.channel === 'WHATSAPP' ? invitation.contactValue : null);

  // Solo alumnos que EXISTEN en la escuela de la invitación: un alumno borrado después del
  // envío no puede reventar el claim con un error de FK (dejaba usuario creado sin alumnos
  // y la invitación atascada en SENT, imposible de reintentar).
  const validStudents = invitation.studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: invitation.studentIds }, schoolId: invitation.schoolId },
        select: { id: true },
      })
    : [];

  let setCookie: string | null = null;
  let sessionToken: string | null = null;
  let userId: string | null = null;

  try {
    // schoolId NO va en el body (additionalField con input:false): lo asigna la transacción.
    const signUp = await auth.api.signUpEmail({
      body: { email, password, name, phoneE164: phone ?? undefined },
      returnHeaders: true,
    });
    ({ setCookie, sessionToken, userId } = extractAuthResult(signUp as AuthResponseShape));
    if (!userId) throw new Error('SIGNUP_FAILED');
  } catch (err) {
    if (err instanceof Error && err.message === 'SIGNUP_FAILED') throw err;
    if (!isUserAlreadyExistsError(err)) throw err;

    // Ya existe una cuenta con ese contacto: segunda invitación al mismo padre (hermano
    // nuevo, cambio de colegio) o un claim anterior que quedó a medias. El claim exige la
    // contraseña de ESA cuenta (sign-in); si no coincide, que recupere la contraseña.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, active: true },
    });
    // Nunca re-rolear una cuenta de staff/director a parent por un claim.
    if (!existing || existing.role !== 'parent' || !existing.active) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }
    try {
      const signIn = await auth.api.signInEmail({
        body: { email, password },
        returnHeaders: true,
      });
      ({ setCookie, sessionToken } = extractAuthResult(signIn as AuthResponseShape));
      userId = existing.id;
    } catch {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }
  }

  if (!userId) {
    throw new Error('SIGNUP_FAILED');
  }
  const uid = userId;

  // claimedByUserId es @unique: un padre con varias invitaciones claimeadas solo puede
  // atribuirse una. Las siguientes se marcan CLAIMED sin atribución (no rompe conteos:
  // registeredParentsCount cuenta por status).
  const alreadyAttributed = await prisma.invitation.findFirst({
    where: { claimedByUserId: uid },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    // Guard atómico contra doble-claim: si otro request ya la claimeó entre el check de
    // arriba y acá, count viene 0 y se aborta sin pisar nada.
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, status: { in: ['PENDING', 'SENT'] } },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date(),
        ...(alreadyAttributed ? {} : { claimedByUserId: uid }),
      },
    });
    if (claimed.count === 0) {
      throw new Error('INVITATION_ALREADY_USED');
    }
    await tx.user.update({
      where: { id: uid },
      data: {
        role: 'parent',
        schoolId: invitation.schoolId,
        ...(phone ? { phoneE164: phone } : {}),
      },
    });
    for (const s of validStudents) {
      await tx.parentStudent.upsert({
        where: { parentId_studentId: { parentId: uid, studentId: s.id } },
        create: { parentId: uid, studentId: s.id },
        update: {},
      });
    }
  });

  return {
    userId: uid,
    schoolId: invitation.schoolId,
    sessionToken,
    setCookie,
  };
}
