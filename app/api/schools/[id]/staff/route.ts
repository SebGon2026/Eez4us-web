import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsonError, requireSchool } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];
// Roles que el director puede crear: soporte web + portón mobile. NUNCA director,
// vendor, super_admin ni parent desde acá.
const MANAGEABLE_ROLES = ['support_staff', 'logistics'] as const;

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(MANAGEABLE_ROLES),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ALLOWED_ROLES);

    const staff = await prisma.user.findMany({
      where: { schoolId, role: { in: [...MANAGEABLE_ROLES] } },
      orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { finalizedTrips: true } },
      },
    });

    return Response.json({
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        active: s.active,
        createdAt: s.createdAt.toISOString(),
        deliveredCount: s._count.finalizedTrips,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    const session = await requireSchool(req, schoolId, ALLOWED_ROLES);
    const body = createSchema.parse(await req.json());

    const emailExists = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (emailExists) {
      return Response.json({ error: 'EMAIL_ALREADY_USED' }, { status: 409 });
    }

    // Mismo patrón que el alta de director: signUp y luego seteamos rol + escuela.
    await auth.api.signUpEmail({
      body: { email: body.email, password: body.password, name: body.name },
    });
    const user = await prisma.user.update({
      where: { email: body.email },
      data: { role: body.role, schoolId, emailVerified: true },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        metadata: { role: body.role, email: body.email },
      },
    });

    return Response.json(
      {
        staff: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt.toISOString(),
          deliveredCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
