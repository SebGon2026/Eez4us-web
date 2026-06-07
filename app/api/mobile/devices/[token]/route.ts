import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const session = await requireSession(req);
    const { token } = await ctx.params;
    const existing = await prisma.pushToken.findUnique({ where: { expoPushToken: token } });
    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    await prisma.pushToken.delete({ where: { expoPushToken: token } });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
