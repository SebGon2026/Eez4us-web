import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10) || 30, 100);

    const trips = await prisma.trip.findMany({
      where: { parentId: session.user.id, status: { in: ['ENTREGADO', 'CANCELADO'] }, isWalkup: false },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        pickupPoint: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true, model: true } },
        tripStudents: {
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    return Response.json({
      trips: trips.map((t) => ({
        id: t.id,
        status: t.status,
        origin: t.origin,
        startedAt: t.startedAt.toISOString(),
        arrivedAt: t.arrivedAt?.toISOString() ?? null,
        deliveredAt: t.deliveredAt?.toISOString() ?? null,
        endedAt: t.endedAt?.toISOString() ?? null,
        pickupPoint: t.pickupPoint,
        vehicle: t.vehicle,
        students: t.tripStudents.map((ts) => ts.student),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
