import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/session';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = schema.parse(await req.json());
    const signIn = await auth.api.signInEmail({
      body: { email: body.email, password: body.password },
      asResponse: true,
    });
    if (!signIn.ok) {
      return Response.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }
    const cookie = signIn.headers.get('set-cookie') ?? '';
    const signInData = (await signIn.json()) as { token?: string };
    const sessionToken = signInData.token ?? null;
    if (!sessionToken) {
      // better-auth no devolvió session token: algo está roto del lado del server.
      // Preferible fallar acá antes que el mobile asuma sesión inválida silenciosamente.
      return Response.json({ error: 'AUTH_BACKEND_ERROR' }, { status: 500 });
    }
    const jwtRes = await auth.api.getToken({ headers: new Headers({ cookie }) });
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        phoneE164: true,
        emailVerified: true,
        active: true,
      },
    });
    // Cuenta dada de baja por el director: bloqueamos el acceso y limpiamos la
    // sesión que better-auth ya creó en el signIn.
    if (user && !user.active) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      return Response.json({ error: 'ACCOUNT_DISABLED' }, { status: 403 });
    }
    const publicUser = user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          phoneE164: user.phoneE164,
          emailVerified: user.emailVerified,
        }
      : null;
    return Response.json({
      sessionToken,
      jwt: (jwtRes as { token?: string } | null)?.token ?? null,
      user: publicUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
