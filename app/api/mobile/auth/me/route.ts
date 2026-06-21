import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        schoolId: true,
        phoneE164: true,
        emailVerified: true,
        // country/timezone/currency: el mobile los usa para prefijo telefónico por país,
        // default de tipo de documento y formato de fechas/hora en la zona del colegio.
        school: {
          select: {
            id: true,
            name: true,
            addressText: true,
            country: true,
            timezone: true,
            currency: true,
          },
        },
      },
    });
    return Response.json({ user });
  } catch (err) {
    return jsonError(err);
  }
}
