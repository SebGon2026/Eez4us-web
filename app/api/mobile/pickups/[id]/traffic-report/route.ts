import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  severity: z.enum(['LIGHT', 'MEDIUM', 'HEAVY']),
  note: z.string().trim().max(200).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.parentId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    await prisma.tripEvent.create({
      data: {
        tripId: id,
        type: 'POSITION_UPDATE',
        metadata: { trafficReport: body.severity, note: body.note ?? null },
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
