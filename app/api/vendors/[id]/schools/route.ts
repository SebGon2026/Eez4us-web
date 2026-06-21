import { z } from 'zod';

import { prisma } from '@/lib/db';
import { createSchoolWithDirector, SchoolCreateError } from '@/lib/schools';
import { jsonError, requireRole } from '@/lib/session';

// Alta self-service de escuela de prueba por un VENDOR (o super_admin). El vendor crea la
// escuela trial y queda auto-enrolado (VendorSchool) para su comisión. El super_admin sigue
// pudiendo crear escuelas vía /api/admin/schools; acá es el camino del agente de venta.
const ALLOWED_ROLES = ['vendor', 'super_admin'];

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  internalCode: z.string().trim().min(3).max(64),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  currency: z.string().trim().length(3).optional(),
  timezone: z.string().trim().max(64).optional(),
  director: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

const ERROR_STATUS: Record<string, number> = {
  CODE_ALREADY_USED: 409,
  DIRECTOR_EMAIL_ALREADY_USED: 409,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ALLOWED_ROLES);
    const { id: vendorId } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, userId: true, active: true },
    });
    if (!vendor) return Response.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 });
    // Un vendor solo opera SU propio vendor; el super_admin puede operar cualquiera.
    if (session.user.role !== 'super_admin' && vendor.userId !== session.user.id) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    if (!vendor.active) return Response.json({ error: 'VENDOR_INACTIVE' }, { status: 409 });

    const body = schema.parse(await req.json());

    const school = await createSchoolWithDirector({
      name: body.name,
      internalCode: body.internalCode,
      city: body.city,
      country: body.country,
      currency: body.currency,
      timezone: body.timezone,
      director: body.director,
      actorId: session.user.id,
      vendorId: vendor.id,
    });

    return Response.json({ school }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    if (err instanceof SchoolCreateError) {
      return Response.json({ error: err.code }, { status: ERROR_STATUS[err.code] ?? 400 });
    }
    return jsonError(err);
  }
}
