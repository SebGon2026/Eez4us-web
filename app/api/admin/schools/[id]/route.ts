import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  active: z.boolean().optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireRole(req, ['super_admin']);
    const { id } = await ctx.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        subscription: true,
        users: {
          where: { role: { in: ['director', 'support_staff'] } },
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            students: true,
            trips: true,
            pickupPoints: true,
            invitations: true,
          },
        },
      },
    });
    if (!school) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    return Response.json({ school });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['super_admin']);
    const { id } = await ctx.params;
    const body = updateSchema.parse(await req.json());
    const updated = await prisma.school.update({ where: { id }, data: body });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId: id,
        action: 'UPDATE',
        entity: 'School',
        entityId: id,
        metadata: body as object,
      },
    });
    return Response.json({ school: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
