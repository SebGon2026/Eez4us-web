import { z } from 'zod';

import { prisma } from '@/lib/db';
import { sendPushToSchoolRoles } from '@/lib/push';
import { broadcastRankedTrips } from '@/lib/pusher-channels';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  pickupPointId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  studentIds: z.array(z.string().cuid()).min(1),
  authorizedFamilyId: z.string().cuid().optional(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const body = schema.parse(await req.json());

    // Validate ownership
    const [vehicle, pickup, links] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: body.vehicleId } }),
      prisma.pickupPoint.findUnique({ where: { id: body.pickupPointId } }),
      prisma.parentStudent.findMany({
        where: { parentId: session.user.id, studentId: { in: body.studentIds } },
        select: {
          studentId: true,
          student: { select: { schoolId: true, pickupMode: true } },
        },
      }),
    ]);
    if (!vehicle || vehicle.parentId !== session.user.id) {
      return Response.json({ error: 'INVALID_VEHICLE' }, { status: 400 });
    }
    if (!pickup || !pickup.active) {
      return Response.json({ error: 'INVALID_PICKUP_POINT' }, { status: 400 });
    }
    if (links.length !== body.studentIds.length) {
      return Response.json({ error: 'INVALID_STUDENTS' }, { status: 400 });
    }
    const schoolIds = new Set(links.map((l) => l.student.schoolId));
    if (schoolIds.size !== 1 || !schoolIds.has(pickup.schoolId)) {
      return Response.json({ error: 'SCHOOL_MISMATCH' }, { status: 400 });
    }

    // "Voy en camino" solo aplica a alumnos que recoge un representante en su vehículo.
    // Los de transporte (van/bus) no los recoge el padre: el backend lo bloquea aunque
    // la UI falle, para no crear trips sin sentido.
    const transportStudent = links.find((l) => l.student.pickupMode === 'TRANSPORT');
    if (transportStudent) {
      return Response.json(
        { error: 'STUDENT_NOT_PRIVATE_PICKUP', studentId: transportStudent.studentId },
        { status: 400 },
      );
    }

    // Refuse if already an active trip. Los walk-up (creados por la miss) no cuentan: no
    // son viajes del padre y no deben bloquear que arranque el suyo.
    const active = await prisma.trip.findFirst({
      where: { parentId: session.user.id, status: { in: ['EN_CAMINO', 'EN_ZONA'] }, isWalkup: false },
    });
    if (active) {
      return Response.json({ error: 'TRIP_ALREADY_ACTIVE', tripId: active.id }, { status: 409 });
    }

    const trip = await prisma.trip.create({
      data: {
        schoolId: pickup.schoolId,
        pickupPointId: pickup.id,
        parentId: session.user.id,
        vehicleId: vehicle.id,
        authorizedFamilyId: body.authorizedFamilyId ?? null,
        status: 'EN_CAMINO',
        lastLat: body.currentLat ?? null,
        lastLng: body.currentLng ?? null,
        lastPositionAt: body.currentLat != null ? new Date() : null,
        tripStudents: {
          create: body.studentIds.map((sid) => ({ studentId: sid })),
        },
        events: { create: { type: 'STARTED' } },
      },
    });

    try {
      await sendPushToSchoolRoles(pickup.schoolId, ['director', 'support_staff'], {
        title: 'Padre en camino',
        body: `${session.user.name ?? 'Un padre'} está en camino`,
        data: { type: 'trip-started', tripId: trip.id },
      });
    } catch {
      // no bloquear
    }
    // El board del staff (ranked por ETA) necesita ver el trip nuevo.
    try {
      await broadcastRankedTrips(pickup.schoolId, pickup.id);
    } catch {
      // realtime best-effort
    }

    return Response.json({ tripId: trip.id, status: trip.status }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
