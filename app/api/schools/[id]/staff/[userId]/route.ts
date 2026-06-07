import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];
const MANAGEABLE_ROLES = ['support_staff', 'logistics'];

const patchSchema = z.object({ active: z.boolean() });

// PATCH: activa/desactiva una cuenta de personal. Soft-disable, NO borra (preserva
// la atribución de entregas). Al desactivar, mata sus sesiones para cortar el
// acceso de inmediato (el JWT de corta vida deja de renovarse).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<Response> {
  try {
    const { id: schoolId, userId } = await params;
    const session = await requireSchool(req, schoolId, ALLOWED_ROLES);
    const body = patchSchema.parse(await req.json());

    if (userId === session.user.id) {
      return Response.json({ error: 'CANNOT_MODIFY_SELF' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true, role: true },
    });
    if (!target || target.schoolId !== schoolId) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (!MANAGEABLE_ROLES.includes(target.role)) {
      return Response.json({ error: 'CANNOT_MODIFY_ROLE' }, { status: 403 });
    }

    await prisma.user.update({ where: { id: userId }, data: { active: body.active } });
    if (!body.active) {
      await prisma.session.deleteMany({ where: { userId } });
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId,
        action: body.active ? 'ENABLE' : 'DISABLE',
        entity: 'User',
        entityId: userId,
        metadata: { role: target.role },
      },
    });

    return Response.json({ ok: true, active: body.active });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
