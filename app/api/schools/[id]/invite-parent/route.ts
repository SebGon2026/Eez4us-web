import { z } from 'zod';

import { prisma } from '@/lib/db';
import { inviteRepresentatives, representativeSchema } from '@/lib/invitations';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

// Alta INDIVIDUAL de un padre a alumno(s) existente(s), sin pasar por el Excel (obs. del
// cliente: si una sola familia se cambia de colegio, no hace falta re-subir todo el Excel).
const bodySchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).max(20),
  representative: representativeSchema,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);
    const body = bodySchema.parse(await req.json());

    const students = await prisma.student.findMany({
      where: { id: { in: body.studentIds }, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (students.length !== body.studentIds.length) {
      return Response.json({ error: 'STUDENT_NOT_FOUND' }, { status: 404 });
    }

    const { createdCount, sentCount, repErrors } = await inviteRepresentatives({
      schoolId,
      studentIds: students.map((s) => s.id),
      studentNames: students.map((s) => `${s.firstName} ${s.lastName}`.trim()),
      representatives: [body.representative],
    });

    return Response.json({
      invitations: { createdCount, sentCount },
      repErrors,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
