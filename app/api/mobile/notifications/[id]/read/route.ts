import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireSession(req);
    const { id } = await ctx.params;
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    await prisma.notification.update({
      where: { id },
      data: { readAt: notif.readAt ?? new Date() },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
