import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

// Inverso de "Ver como director" (impersonate): el super_admin suelta el colegio que
// estaba viendo y vuelve a la vista global (schoolId → null). El rol nunca cambia.
// Sin esto el owner quedaba "atrapado" en el último colegio impersonado.
export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['super_admin']);
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true },
    });
    if (previous?.schoolId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { schoolId: null },
      });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          schoolId: previous.schoolId,
          action: 'IMPERSONATE_EXIT',
          entity: 'School',
          entityId: previous.schoolId,
        },
      });
    }
    return Response.redirect(new URL('/admin/super', req.url), 303);
  } catch (err) {
    return jsonError(err);
  }
}
