import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'support_staff', 'super_admin']);
    const { id } = await ctx.params;
    const auth = await prisma.temporaryAuthorization.findUnique({ where: { id } });
    if (!auth || auth.schoolId !== session.user.schoolId) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (auth.usedAt) {
      return Response.json({ error: 'ALREADY_USED' }, { status: 409 });
    }
    const updated = await prisma.temporaryAuthorization.update({
      where: { id },
      data: { usedAt: new Date(), usedByStaffId: session.user.id },
    });
    return Response.json({ authorization: updated });
  } catch (err) {
    return jsonError(err);
  }
}
