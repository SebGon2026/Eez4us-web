import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const links = await prisma.parentStudent.findMany({
      where: { parentId: session.user.id },
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            grade: { select: { id: true, name: true } },
            pickupMode: true,
            transportName: true,
            transportPlate: true,
            transportPhone: true,
            transportVehicleType: true,
          },
        },
      },
    });
    return Response.json({
      students: links.map((l) => {
        const s = l.student;
        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          birthDate: s.birthDate,
          grade: s.grade,
          // PRIVATE_VEHICLE = el padre lo recoge (habilita "voy en camino").
          // TRANSPORT = van/bus de un tercero; el padre NO lo recoge (solo informativo).
          pickupMode: s.pickupMode,
          transport:
            s.pickupMode === 'TRANSPORT'
              ? {
                  name: s.transportName,
                  plate: s.transportPlate,
                  phone: s.transportPhone,
                  vehicleType: s.transportVehicleType,
                }
              : null,
        };
      }),
    });
  } catch (err) {
    return jsonError(err);
  }
}
