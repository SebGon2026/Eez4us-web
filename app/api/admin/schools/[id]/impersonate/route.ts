import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['super_admin']);
    const { id } = await ctx.params;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });

    // "Ver como director" sin perder rol: mover el schoolId del super_admin
    // a la escuela target. El rol sigue siendo super_admin (puede salir).
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { schoolId: id },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId: id,
        action: 'IMPERSONATE',
        entity: 'School',
        entityId: id,
        metadata: { previousSchoolId: previous?.schoolId ?? null },
      },
    });
    return Response.redirect(new URL('/admin', req.url), 303);
  } catch (err) {
    return jsonError(err);
  }
}
