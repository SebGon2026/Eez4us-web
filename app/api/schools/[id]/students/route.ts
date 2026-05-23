import { z } from 'zod';

import { onStudentCreated } from '@/lib/billing-hooks';
import { prisma } from '@/lib/db';
import { jsonError, requireSchool } from '@/lib/session';

export const runtime = 'edge';

const ALLOWED_ROLES = ['director', 'super_admin'];

const createSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  gradeId: z.string().min(1).nullable().optional(),
  externalId: z.string().trim().min(1).max(40).nullable().optional(),
  birthDate: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);
    const body = createSchema.parse(await req.json());

    if (body.gradeId) {
      const g = await prisma.grade.findUnique({
        where: { id: body.gradeId },
        select: { schoolId: true },
      });
      if (!g || g.schoolId !== schoolId) {
        return Response.json({ error: 'GRADE_NOT_FOUND' }, { status: 404 });
      }
    }

    if (body.externalId) {
      const conflict = await prisma.student.findUnique({
        where: { schoolId_externalId: { schoolId, externalId: body.externalId } },
        select: { id: true },
      });
      if (conflict) {
        return Response.json({ error: 'EXTERNAL_ID_TAKEN' }, { status: 409 });
      }
    }

    const student = await prisma.student.create({
      data: {
        schoolId,
        firstName: body.firstName,
        lastName: body.lastName,
        gradeId: body.gradeId ?? null,
        externalId: body.externalId ?? null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
      },
      select: { id: true, firstName: true, lastName: true, externalId: true, gradeId: true },
    });
    await onStudentCreated(schoolId);
    return Response.json({ student });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
