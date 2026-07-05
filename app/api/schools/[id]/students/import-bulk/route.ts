import { onStudentCreated } from '@/lib/billing-hooks';
import { prisma } from '@/lib/db';
import { jsonError, requireSchool } from '@/lib/session';
import { parseStudentsExcel } from '@/lib/student-excel';

const ALLOWED_ROLES = ['director', 'super_admin'];

function normalizeGradeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

    const buf = new Uint8Array(await file.arrayBuffer());
    const { students, errors } = parseStudentsExcel(buf);
    if (!students.length) {
      return Response.json({ error: 'NO_VALID_ROWS', errors }, { status: 400 });
    }

    // Grados del colegio, indexados por nombre normalizado para matchear el texto del Excel.
    const grades = await prisma.grade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    });
    const gradeByName = new Map(grades.map((g) => [normalizeGradeName(g.name), g.id]));

    const rowErrors: Array<{ student: string; reason: string }> = errors.map((e) => ({
      student: `fila ${e.row}`,
      reason: e.message,
    }));
    const warningList: Array<{ student: string; reason: string }> = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const s of students) {
      const studentName = `${s.firstName} ${s.lastName}`.trim();

      let gradeId: string | null = null;
      if (s.gradeName) {
        const matched = gradeByName.get(normalizeGradeName(s.gradeName));
        if (matched) {
          gradeId = matched;
        } else {
          warningList.push({
            student: studentName,
            reason: `grado "${s.gradeName}" no existe en el colegio — se ignoró`,
          });
        }
      }
      const birthDate = s.birthDate ? new Date(s.birthDate) : null;

      try {
        if (s.externalId) {
          // Matrícula presente → upsert idempotente (re-subir el Excel no duplica).
          const existing = await prisma.student.findUnique({
            where: { schoolId_externalId: { schoolId, externalId: s.externalId } },
            select: { id: true },
          });
          if (existing) {
            // Re-import NO destructivo: solo pisa lo que viene en el archivo. Un grado
            // vacío/sin match o un nacimiento vacío dejan el valor existente intacto (si
            // no, re-subir un roster sin esas columnas borraría datos ya cargados a mano).
            await prisma.student.update({
              where: { id: existing.id },
              data: {
                firstName: s.firstName,
                lastName: s.lastName,
                active: true,
                ...(gradeId !== null ? { gradeId } : {}),
                ...(birthDate !== null ? { birthDate } : {}),
              },
            });
            updatedCount += 1;
          } else {
            await prisma.student.create({
              data: {
                schoolId,
                externalId: s.externalId,
                firstName: s.firstName,
                lastName: s.lastName,
                gradeId,
                birthDate,
              },
            });
            createdCount += 1;
          }
        } else {
          // Sin matrícula no se puede deduplicar: se crea siempre.
          await prisma.student.create({
            data: { schoolId, firstName: s.firstName, lastName: s.lastName, gradeId, birthDate },
          });
          createdCount += 1;
        }
      } catch (err) {
        rowErrors.push({
          student: studentName,
          reason: err instanceof Error ? err.message : 'error al guardar',
        });
      }
    }

    if (createdCount > 0 || updatedCount > 0) {
      // Recalcula el contador denormalizado / quantity de la suscripción. Incluye updates
      // porque el update reactiva (active:true) alumnos dados de baja → cambia el conteo.
      await onStudentCreated(schoolId);
    }

    const totalRows = students.length + errors.length;
    const errorRows = rowErrors.length;
    const successRows = createdCount + updatedCount;

    await prisma.importJob.create({
      data: {
        schoolId,
        createdById: session.user.id,
        filename: file.name || 'alumnos.xlsx',
        status: errorRows > 0 && successRows === 0 ? 'FAILED' : 'DONE',
        totalRows,
        successRows,
        errorRows,
        warnings: warningList.length,
        report: { kind: 'students', createdCount, updatedCount, rowErrors, warningList },
        finishedAt: new Date(),
      },
    });

    return Response.json({
      createdCount,
      updatedCount,
      errorRows,
      warnings: warningList.length,
      rowErrors,
      warningList,
    });
  } catch (err) {
    return jsonError(err);
  }
}
