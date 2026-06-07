import { z } from 'zod';

import { prisma } from '@/lib/db';
import { inviteRepresentatives, representativeSchema } from '@/lib/invitations';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

const bodySchema = z.object({
  representatives: z.array(representativeSchema).min(1).max(10),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> },
): Promise<Response> {
  try {
    const { id: schoolId, studentId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);
    const body = bodySchema.parse(await req.json());

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, schoolId: true, firstName: true, lastName: true },
    });
    if (!student || student.schoolId !== schoolId) {
      return Response.json({ error: 'STUDENT_NOT_FOUND' }, { status: 404 });
    }

    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const { createdCount, sentCount, repErrors } = await inviteRepresentatives({
      schoolId,
      studentIds: [student.id],
      studentNames: [studentName],
      representatives: body.representatives,
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
