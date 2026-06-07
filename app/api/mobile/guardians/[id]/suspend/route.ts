import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const g = await prisma.authorizedFamily.findUnique({ where: { id } });
    if (!g || g.parentId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const updated = await prisma.authorizedFamily.update({
      where: { id },
      data: { active: false },
    });
    return Response.json({ guardian: updated });
  } catch (err) {
    return jsonError(err);
  }
}
