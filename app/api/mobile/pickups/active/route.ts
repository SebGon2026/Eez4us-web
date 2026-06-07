import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const trip = await prisma.trip.findFirst({
      where: { parentId: session.user.id, status: { in: ['EN_CAMINO', 'EN_ZONA'] }, isWalkup: false },
      orderBy: { startedAt: 'desc' },
      include: {
        pickupPoint: true,
        vehicle: true,
        authorizedFamily: true,
        tripStudents: {
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!trip) return Response.json({ trip: null });
    return Response.json({
      trip: {
        id: trip.id,
        status: trip.status,
        startedAt: trip.startedAt.toISOString(),
        arrivedAt: trip.arrivedAt?.toISOString() ?? null,
        etaSeconds: trip.etaSeconds,
        etaUpdatedAt: trip.etaUpdatedAt?.toISOString() ?? null,
        lastLat: trip.lastLat,
        lastLng: trip.lastLng,
        pickupPoint: {
          id: trip.pickupPoint.id,
          name: trip.pickupPoint.name,
          centerLat: trip.pickupPoint.centerLat,
          centerLng: trip.pickupPoint.centerLng,
          radiusMeters: trip.pickupPoint.radiusMeters,
        },
        vehicle: trip.vehicle,
        authorizedFamily: trip.authorizedFamily,
        students: trip.tripStudents.map((ts) => ts.student),
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
