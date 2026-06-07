import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const existing = await prisma.temporaryAuthorization.findUnique({ where: { id } });
    if (!existing || existing.parentId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    await prisma.temporaryAuthorization.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
