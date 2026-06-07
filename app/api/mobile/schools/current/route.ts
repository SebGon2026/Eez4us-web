import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    if (!session.user.schoolId) {
      return Response.json({ school: null });
    }
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: {
        id: true,
        name: true,
        addressText: true,
        addressLat: true,
        addressLng: true,
        internalCode: true,
        active: true,
        // Branding para theming por escuela en mobile (paridad con el web)
        logoUrl: true,
        brandHue: true,
        brandHueSecondary: true,
        pickupPoints: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            centerLat: true,
            centerLng: true,
            radiusMeters: true,
          },
        },
      },
    });
    return Response.json({ school });
  } catch (err) {
    return jsonError(err);
  }
}
