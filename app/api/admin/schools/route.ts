import { z } from 'zod';

import { prisma } from '@/lib/db';
import { createSchoolWithDirector, SchoolCreateError } from '@/lib/schools';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  internalCode: z.string().trim().min(3).max(64),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  // overrides opcionales; si faltan se derivan del país.
  currency: z.string().trim().length(3).optional(),
  timezone: z.string().trim().max(64).optional(),
  // días de prueba de esta escuela (el owner decide al crear; default 14).
  trialDays: z.number().int().min(1).max(365).optional(),
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

export async function GET(req: Request): Promise<Response> {
  try {
    await requireRole(req, ['super_admin']);
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: { subscription: true, _count: { select: { students: true, users: true } } },
    });
    return Response.json({ schools });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['super_admin']);
    const body = schema.parse(await req.json());

    const school = await createSchoolWithDirector({
      name: body.name,
      internalCode: body.internalCode,
      city: body.city,
      country: body.country,
      currency: body.currency,
      timezone: body.timezone,
      trialDays: body.trialDays,
      director: body.director,
      actorId: session.user.id,
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
