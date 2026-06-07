import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  addressText: z.string().trim().max(300).nullable().optional(),
  addressLat: z.number().nullable().optional(),
  addressLng: z.number().nullable().optional(),
  logoUrl: z
    .string()
    .max(700_000)
    .refine(
      (v) => /^(https?:\/\/|data:image\/(png|svg\+xml|jpeg|webp);base64,)/.test(v),
      { message: 'INVALID_LOGO' },
    )
    .nullable()
    .optional(),
  brandHue: z.number().int().min(0).max(360).nullable().optional(),
  brandHueSecondary: z.number().int().min(0).max(360).nullable().optional(),
  locale: z.enum(['es-MX', 'es-AR']).optional(),
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    const school = await prisma.school.findUnique({ where: { id: session.user.schoolId } });
    return Response.json({ school });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    const body = schema.parse(await req.json());
    const updated = await prisma.school.update({
      where: { id: session.user.schoolId },
      data: body,
    });
    return Response.json({ school: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
