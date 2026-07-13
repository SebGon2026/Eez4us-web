import { onStudentCreated } from '@/lib/billing-hooks';
import { parseCombinedExcel } from '@/lib/combined-excel';
import { prisma } from '@/lib/db';
import { createInvitation, pickChannel } from '@/lib/invitations';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ParentGroup {
  firstName: string;
  lastName: string;
  email?: string;
  phoneE164?: string;
  studentKeys: Set<string>;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    const session = await requireSchool(req, schoolId, ALLOWED_ROLES);

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
    const { rows, errors } = parseCombinedExcel(buf, school?.country);
    if (!rows.length) {
      return Response.json({ error: 'NO_VALID_ROWS', errors }, { status: 400 });
    }

    const grades = await prisma.grade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    });
    const gradeByName = new Map(grades.map((g) => [normalizeName(g.name), g.id]));

    const rowErrors: Array<{ item: string; reason: string }> = errors.map((e) => ({
      item: `fila ${e.row}`,
      reason: e.message,
    }));
    const warningList: Array<{ item: string; reason: string }> = [];
    let studentsCreated = 0;
    let studentsUpdated = 0;

    // Un alumno puede venir en varias filas (una por padre). Con matrícula se deduplica por
    // matrícula (y contra la DB, upsert idempotente); sin matrícula, dentro del archivo se
    // deduplica por nombre+grado (el caso mamá y papá listados en dos filas) pero contra la
    // DB se crea siempre (igual que el importador de solo-alumnos).
    const keyOf = (s: (typeof rows)[number]['student']): string =>
      s.externalId
        ? `ext:${s.externalId}`
        : `name:${normalizeName(s.firstName)}|${normalizeName(s.lastName)}|${normalizeName(s.gradeName ?? '')}`;

    const studentIdByKey = new Map<string, string>();
    for (const r of rows) {
      const s = r.student;
      const key = keyOf(s);
      if (studentIdByKey.has(key)) continue;
      const studentName = `${s.firstName} ${s.lastName}`.trim();

      let gradeId: string | null = null;
      if (s.gradeName) {
        const matched = gradeByName.get(normalizeName(s.gradeName));
        if (matched) {
          gradeId = matched;
        } else {
          warningList.push({
            item: studentName,
            reason: `grado "${s.gradeName}" no existe en el colegio — se ignoró`,
          });
        }
      }

      try {
        if (s.externalId) {
          const existing = await prisma.student.findUnique({
            where: { schoolId_externalId: { schoolId, externalId: s.externalId } },
            select: { id: true },
          });
          if (existing) {
            // Re-import NO destructivo: un grado vacío/sin match no pisa el existente.
            await prisma.student.update({
              where: { id: existing.id },
              data: {
                firstName: s.firstName,
                lastName: s.lastName,
                active: true,
                ...(gradeId !== null ? { gradeId } : {}),
              },
            });
            studentsUpdated += 1;
            studentIdByKey.set(key, existing.id);
          } else {
            const created = await prisma.student.create({
              data: {
                schoolId,
                externalId: s.externalId,
                firstName: s.firstName,
                lastName: s.lastName,
                gradeId,
              },
              select: { id: true },
            });
            studentsCreated += 1;
            studentIdByKey.set(key, created.id);
          }
        } else {
          const created = await prisma.student.create({
            data: { schoolId, firstName: s.firstName, lastName: s.lastName, gradeId },
            select: { id: true },
          });
          studentsCreated += 1;
          studentIdByKey.set(key, created.id);
        }
      } catch (err) {
        rowErrors.push({
          item: studentName,
          reason: err instanceof Error ? err.message : 'error al guardar',
        });
      }
    }

    // Padres agrupados por contacto: un padre en N filas (N hijos) → UNA invitación con todos.
    const groups = new Map<string, ParentGroup>();
    for (const r of rows) {
      if (!r.parent) continue;
      const contactKey = r.parent.email?.toLowerCase() || r.parent.phoneE164 || '';
      if (!contactKey) continue;
      const studentKey = keyOf(r.student);
      if (!studentIdByKey.has(studentKey)) continue;
      const g = groups.get(contactKey);
      if (g) {
        g.studentKeys.add(studentKey);
      } else {
        groups.set(contactKey, {
          firstName: r.parent.firstName,
          lastName: r.parent.lastName,
          email: r.parent.email,
          phoneE164: r.parent.phoneE164,
          studentKeys: new Set([studentKey]),
        });
      }
    }

    let invitationsCreated = 0;
    let invitationsMerged = 0;
    const skippedClaimed: Array<{ parent: string; contact: string }> = [];

    for (const g of groups.values()) {
      const parentName = `${g.firstName} ${g.lastName}`.trim();
      const studentIds = [...g.studentKeys]
        .map((k) => studentIdByKey.get(k))
        .filter((id): id is string => Boolean(id));
      const channel = pickChannel(g);
      if (!channel || studentIds.length === 0) continue;
      const contactValue = channel === 'EMAIL' ? g.email! : g.phoneE164!;

      try {
        // Re-subir el archivo no debe duplicar: si ya hay una invitación viva para el mismo
        // contacto se le suman los alumnos; si el padre ya claimeó, se omite y se reporta.
        const existing = await prisma.invitation.findFirst({
          where: {
            schoolId,
            contactValue: { equals: contactValue, mode: 'insensitive' },
            status: { in: ['PENDING', 'SENT', 'CLAIMED'] },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, studentIds: true, recipientName: true },
        });
        if (existing?.status === 'CLAIMED') {
          skippedClaimed.push({ parent: parentName, contact: contactValue });
          continue;
        }
        if (existing) {
          const merged = [...new Set([...existing.studentIds, ...studentIds])];
          await prisma.invitation.update({
            where: { id: existing.id },
            data: {
              studentIds: merged,
              recipientName: existing.recipientName ?? (parentName || null),
            },
          });
          invitationsMerged += 1;
        } else {
          // createInvitation crea en PENDING: acá NO se envía nada. El director dispara el
          // envío después desde /admin/invitations (seleccionadas, por grado o todas).
          await createInvitation({
            schoolId,
            parent: {
              firstName: g.firstName,
              lastName: g.lastName,
              email: g.email ?? null,
              phoneE164: g.phoneE164 ?? null,
            },
            studentIds,
            channel,
          });
          invitationsCreated += 1;
        }
      } catch (err) {
        rowErrors.push({
          item: parentName,
          reason: err instanceof Error ? err.message : 'error al crear la invitación',
        });
      }
    }

    if (studentsCreated > 0 || studentsUpdated > 0) {
      // Recalcula el contador denormalizado / quantity de la suscripción (updates incluidos
      // porque reactivan alumnos dados de baja).
      await onStudentCreated(schoolId);
    }

    const totalRows = rows.length + errors.length;
    const successRows = studentsCreated + studentsUpdated;
    const errorRows = rowErrors.length;

    await prisma.importJob.create({
      data: {
        schoolId,
        createdById: session.user.id,
        filename: file.name || 'colegio.xlsx',
        status: errorRows > 0 && successRows === 0 ? 'FAILED' : 'DONE',
        totalRows,
        successRows,
        errorRows,
        warnings: warningList.length,
        report: {
          kind: 'combined',
          studentsCreated,
          studentsUpdated,
          invitationsCreated,
          invitationsMerged,
          skippedClaimed,
          rowErrors,
          warningList,
        },
        finishedAt: new Date(),
      },
    });

    return Response.json({
      studentsCreated,
      studentsUpdated,
      invitationsCreated,
      invitationsMerged,
      skippedClaimed,
      rowErrors,
      warningList,
    });
  } catch (err) {
    return jsonError(err);
  }
}
