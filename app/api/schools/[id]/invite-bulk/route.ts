import { prisma } from '@/lib/db';
import { parseParentsExcel } from '@/lib/excel';
import { createInvitation, pickChannel, sendInvitation } from '@/lib/invitations';
import { localeForCountry } from '@/lib/locale';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

interface ParentGroup {
  firstName: string;
  lastName: string;
  email?: string;
  phoneE164?: string;
  ids: Set<string>;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'FILE_REQUIRED' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { country: true },
    });

    const buf = new Uint8Array(await file.arrayBuffer());
    const { parents, errors } = parseParentsExcel(buf, school?.country);

    const rowErrors: Array<{ parent: string; reason: string }> = errors.map((e) => ({
      parent: `fila ${e.row}`,
      reason: e.message,
    }));

    // Referencias de alumnos: matchear por matrícula (externalId) O por id interno — así la
    // plantilla precargada puede referenciar alumnos SIN matrícula (obs. del cliente: "¿cuál
    // es el ID si la matrícula es opcional?" → la plantilla usa el id interno como fallback).
    const refs = [...new Set(parents.flatMap((p) => p.studentExternalIds))];
    const refStudents = refs.length
      ? await prisma.student.findMany({
          where: { schoolId, OR: [{ externalId: { in: refs } }, { id: { in: refs } }] },
          select: { id: true, externalId: true, firstName: true, lastName: true },
        })
      : [];
    const studentByRef = new Map<string, (typeof refStudents)[number]>();
    for (const s of refStudents) {
      if (s.externalId) studentByRef.set(s.externalId, s);
      studentByRef.set(s.id, s);
    }

    // Agrupar por padre (email o teléfono): un padre con varios hijos → UNA sola invitación
    // que ata a todos sus alumnos (si no, se crean invitaciones duplicadas que se pisan al
    // claimear con el mismo email).
    const groups = new Map<string, ParentGroup>();
    for (const p of parents) {
      const key = (p.email && p.email.toLowerCase()) || p.phoneE164 || '';
      if (!key) continue;
      const g = groups.get(key);
      if (g) {
        p.studentExternalIds.forEach((id) => g.ids.add(id));
      } else {
        groups.set(key, {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phoneE164: p.phoneE164,
          ids: new Set(p.studentExternalIds),
        });
      }
    }

    const created: Array<{
      invitationId: string;
      token: string;
      channel: 'EMAIL' | 'WHATSAPP';
      contactValue: string;
      parentName: string;
      studentNames: string[];
    }> = [];

    for (const g of groups.values()) {
      const parentName = `${g.firstName} ${g.lastName}`.trim();
      const matched = [...g.ids]
        .map((ref) => studentByRef.get(ref))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      if (matched.length === 0) {
        rowErrors.push({ parent: parentName, reason: 'ningún alumno coincide con los IDs cargados' });
        continue;
      }
      const channel = pickChannel(g);
      if (!channel) {
        rowErrors.push({ parent: parentName, reason: 'sin email ni teléfono' });
        continue;
      }
      try {
        const invitation = await createInvitation({
          schoolId,
          parent: g,
          studentIds: matched.map((s) => s.id),
          channel,
        });
        created.push({
          invitationId: invitation.id,
          token: invitation.token,
          channel,
          contactValue: invitation.contactValue,
          parentName,
          studentNames: matched.map((s) => `${s.firstName} ${s.lastName}`.trim()),
        });
      } catch (err) {
        rowErrors.push({ parent: parentName, reason: err instanceof Error ? err.message : 'unknown' });
      }
    }

    const sendResults = await Promise.allSettled(
      created.map((c) =>
        sendInvitation({
          invitationId: c.invitationId,
          channel: c.channel,
          contactValue: c.contactValue,
          token: c.token,
          parentName: c.parentName,
          studentNames: c.studentNames,
          locale: localeForCountry(school?.country),
        }),
      ),
    );

    const sendFailures = sendResults
      .map((r, i) =>
        r.status === 'rejected' ? { parent: created[i].parentName, reason: String(r.reason) } : null,
      )
      .filter(Boolean);

    // Guía de cobertura: qué alumnos ACTIVOS quedaron sin ninguna invitación viva, para que
    // el director sepa a quién le falta padre (obs. del cliente: "que diga mira te falta").
    const [allStudents, liveInvs] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, active: true },
        select: { id: true, firstName: true, lastName: true, externalId: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.invitation.findMany({
        where: { schoolId, status: { in: ['PENDING', 'SENT', 'CLAIMED'] } },
        select: { studentIds: true },
      }),
    ]);
    const invited = new Set<string>();
    liveInvs.forEach((inv) => inv.studentIds.forEach((id) => invited.add(id)));
    const studentsWithoutParent = allStudents
      .filter((s) => !invited.has(s.id))
      .map((s) => ({ name: `${s.firstName} ${s.lastName}`.trim(), externalId: s.externalId }));

    return Response.json({
      createdCount: created.length,
      sentCount: sendResults.filter((r) => r.status === 'fulfilled').length,
      rowErrors,
      sendFailures,
      coverage: {
        totalStudents: allStudents.length,
        withoutParent: studentsWithoutParent.length,
      },
      studentsWithoutParent: studentsWithoutParent.slice(0, 100),
    });
  } catch (err) {
    return jsonError(err);
  }
}
