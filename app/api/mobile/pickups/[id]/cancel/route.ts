import { prisma } from '@/lib/db';
import { broadcastRankedTrips, broadcastTripUpdate } from '@/lib/pusher-channels';
import { jsonError, requireRole } from '@/lib/session';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.parentId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (trip.status === 'ENTREGADO') {
      return Response.json({ error: 'ALREADY_DELIVERED' }, { status: 409 });
    }
    const now = new Date();
    await prisma.trip.update({
      where: { id },
      data: { status: 'CANCELADO', endedAt: now },
    });
    await prisma.tripEvent.create({ data: { tripId: id, type: 'CANCELLED' } });
    try {
      await broadcastTripUpdate(id);
      await broadcastRankedTrips(trip.schoolId, trip.pickupPointId);
    } catch {}
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
