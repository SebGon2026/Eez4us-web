import { customAlphabet } from 'nanoid';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { dispatchInvitation, inviteLink } from '@/lib/invitations';
import { localeForCountry } from '@/lib/locale';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

const TOKEN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateToken = customAlphabet(TOKEN_ALPHABET, 24);

// Tope por llamada para no reventar el límite de subrequests del Worker (cada envío es un
// fetch a Resend/n8n + updates a Accelerate). El response reporta `remaining` para que la
// UI avise que hay que repetir la acción.
const MAX_PER_CALL = 200;

const bodySchema = z.object({
  // 'send' = primer envío (solo PENDING). 'reminder' = recordatorio a los que no se
  // registraron (SENT/EXPIRED, nunca CLAIMED) con token y vencimiento nuevos.
  mode: z.enum(['send', 'reminder']),
  ids: z.array(z.string().min(1)).max(500).optional(),
  gradeId: z.string().min(1).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    const { mode, ids, gradeId } = parsed.data;

    const statuses: Array<'PENDING' | 'SENT' | 'EXPIRED'> =
      mode === 'send' ? ['PENDING'] : ['SENT', 'EXPIRED'];

    // El grado de una invitación se deriva de sus alumnos: filtra las que atan al menos un
    // alumno de ese grado. Solo aplica cuando no vienen ids explícitos.
    let gradeStudentIds: string[] | null = null;
    if (!ids?.length && gradeId) {
      const gradeStudents = await prisma.student.findMany({
        where: { schoolId, gradeId },
        select: { id: true },
      });
      gradeStudentIds = gradeStudents.map((s) => s.id);
    }

    const where = {
      schoolId,
      status: { in: statuses },
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(gradeStudentIds ? { studentIds: { hasSome: gradeStudentIds } } : {}),
    };

    const [total, invitations, school] = await Promise.all([
      prisma.invitation.count({ where }),
      prisma.invitation.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: MAX_PER_CALL,
        select: {
          id: true,
          token: true,
          channel: true,
          contactValue: true,
          recipientName: true,
          studentIds: true,
        },
      }),
      prisma.school.findUnique({ where: { id: schoolId }, select: { country: true } }),
    ]);

    if (!invitations.length) {
      return Response.json({ targeted: 0, sentCount: 0, failedCount: 0, failures: [], remaining: 0 });
    }

    const allStudentIds = [...new Set(invitations.flatMap((i) => i.studentIds))];
    const students = allStudentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: allStudentIds }, schoolId },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nameOf = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]));
    const locale = localeForCountry(school?.country);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const results = await Promise.allSettled(
      invitations.map(async (inv) => {
        // El recordatorio rota el token (link nuevo + vencimiento fresco); el primer envío
        // usa el token existente pero igual refresca el vencimiento. El token nuevo se
        // persiste ANTES de enviarlo: si el update fallara después del envío, el padre
        // recibía un link que no existe en la DB (404). Si falla el envío, queda reportado
        // en failures y el director reintenta.
        const token = mode === 'reminder' ? generateToken() : inv.token;
        if (mode === 'reminder') {
          await prisma.invitation.update({
            where: { id: inv.id },
            data: { token, expiresAt },
          });
        }
        await dispatchInvitation({
          channel: inv.channel,
          contactValue: inv.contactValue,
          link: inviteLink(token),
          parentName: inv.recipientName ?? 'Padre/Madre',
          studentNames: inv.studentIds
            .map((id) => nameOf.get(id))
            .filter((n): n is string => Boolean(n)),
          locale,
        });
        await prisma.invitation.update({
          where: { id: inv.id },
          data: { status: 'SENT', sentAt: new Date(), ...(mode === 'send' ? { expiresAt } : {}) },
        });
      }),
    );

    const failures = results
      .map((r, i) =>
        r.status === 'rejected'
          ? { contact: invitations[i].contactValue, reason: String(r.reason) }
          : null,
      )
      .filter((f): f is { contact: string; reason: string } => Boolean(f));

    return Response.json({
      targeted: invitations.length,
      sentCount: results.filter((r) => r.status === 'fulfilled').length,
      failedCount: failures.length,
      failures,
      remaining: Math.max(0, total - invitations.length),
    });
  } catch (err) {
    return jsonError(err);
  }
}
