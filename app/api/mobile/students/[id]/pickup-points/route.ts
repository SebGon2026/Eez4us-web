import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const link = await prisma.parentStudent.findFirst({
      where: { parentId: session.user.id, studentId: id },
      select: { student: { select: { schoolId: true } } },
    });
    if (!link) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    const pickupPoints = await prisma.pickupPoint.findMany({
      where: { schoolId: link.student.schoolId, active: true },
      select: { id: true, name: true, centerLat: true, centerLng: true, radiusMeters: true },
    });
    return Response.json({ pickupPoints });
  } catch (err) {
    return jsonError(err);
  }
}
