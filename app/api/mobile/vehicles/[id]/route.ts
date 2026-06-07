import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const updateSchema = z.object({
  plate: z.string().trim().min(1).max(20).optional(),
  model: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).max(40).optional(),
  active: z.boolean().optional(),
});

async function ensureOwner(parentId: string, id: string) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v || v.parentId !== parentId) return null;
  return v;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const vehicle = await ensureOwner(session.user.id, id);
    if (!vehicle) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    return Response.json({ vehicle });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const existing = await ensureOwner(session.user.id, id);
    if (!existing) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    const body = updateSchema.parse(await req.json());
    const updated = await prisma.vehicle.update({ where: { id }, data: body });
    return Response.json({ vehicle: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const existing = await ensureOwner(session.user.id, id);
    if (!existing) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    await prisma.vehicle.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
