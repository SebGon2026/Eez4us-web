import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export const runtime = 'edge';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const links = await prisma.parentStudent.findMany({
      where: { parentId: session.user.id, student: { active: true } },
      orderBy: { createdAt: 'asc' },
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: { select: { id: true, name: true } },
          },
        },
      },
    });
    return Response.json({
      students: links.map((l) => ({
        id: l.student.id,
        firstName: l.student.firstName,
        lastName: l.student.lastName,
        grade: l.student.grade,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
