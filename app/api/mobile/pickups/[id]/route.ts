import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireSession(req);
    const { id } = await ctx.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        pickupPoint: true,
        vehicle: true,
        authorizedFamily: true,
        parent: { select: { id: true, name: true } },
        finalizedBy: { select: { id: true, name: true } },
        tripStudents: { include: { student: true } },
        events: { orderBy: { timestamp: 'asc' } },
      },
    });
    if (!trip) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    const canRead =
      trip.parentId === session.user.id ||
      (session.user.schoolId === trip.schoolId &&
        ['director', 'support_staff', 'super_admin'].includes(session.user.role));
    if (!canRead) return Response.json({ error: 'FORBIDDEN' }, { status: 403 });

    return Response.json({
      trip: {
        id: trip.id,
        status: trip.status,
        origin: trip.origin,
        startedAt: trip.startedAt.toISOString(),
        arrivedAt: trip.arrivedAt?.toISOString() ?? null,
        deliveredAt: trip.deliveredAt?.toISOString() ?? null,
        endedAt: trip.endedAt?.toISOString() ?? null,
        etaSeconds: trip.etaSeconds,
        // Primer ETA calculado del viaje (metadata del primer POSITION_UPDATE que lo trajo).
        // null en viajes viejos o sin GPS (ESTOY_AFUERA).
        etaInitialSeconds:
          trip.events
            .map((e) =>
              e.type === 'POSITION_UPDATE' &&
              e.metadata &&
              typeof e.metadata === 'object' &&
              typeof (e.metadata as { etaSeconds?: unknown }).etaSeconds === 'number'
                ? ((e.metadata as { etaSeconds: number }).etaSeconds)
                : null,
            )
            .find((v) => v != null) ?? null,
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
        // Adulto que retiró (o retira) al alumno: el familiar autorizado del viaje, o el
        // propio padre si no delegó. Distinto de finalizedBy (staff que entregó). En
        // walk-ups (viaje sintético de la miss) no sabemos quién retiró: null.
        pickedUpBy: trip.isWalkup
          ? null
          : (trip.authorizedFamily?.fullName ?? trip.parent?.name ?? null),
        // Staff que finalizó la entrega (prueba de entrega manual). null si aún no se entregó.
        finalizedBy: trip.finalizedBy
          ? { id: trip.finalizedBy.id, name: trip.finalizedBy.name }
          : null,
        students: trip.tripStudents.map((ts) => ts.student),
        events: trip.events.map((e) => ({
          id: e.id,
          type: e.type,
          timestamp: e.timestamp.toISOString(),
          metadata: e.metadata,
        })),
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
