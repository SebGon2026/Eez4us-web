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
    const signInData = (await signIn.json()) as { token?: string; twoFactorRedirect?: boolean };
    // Staff con 2FA intentando entrar por el app: el panel web es su lugar. Sin esto
    // caería en AUTH_BACKEND_ERROR (better-auth no emite token hasta verificar el OTP).
    if (signInData.twoFactorRedirect) {
      return Response.json({ error: 'TWO_FACTOR_REQUIRED' }, { status: 403 });
    }
    const sessionToken = signInData.token ?? null;
    if (!sessionToken) {
      // better-auth no devolvió session token: algo está roto del lado del server.
      // Preferible fallar acá antes que el mobile asuma sesión inválida silenciosamente.
      return Response.json({ error: 'AUTH_BACKEND_ERROR' }, { status: 500 });
    }
    const jwtRes = await auth.api.getToken({ headers: new Headers({ cookie }) });
    // better-auth normaliza el email a lowercase al autenticar y al crear usuarios; el
    // lookup debe hacer lo mismo o un casing distinto saltea el check de ACCOUNT_DISABLED
    // y devuelve user:null con sesión válida.
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        phoneE164: true,
        emailVerified: true,
        active: true,
        // Mismo shape de school que /api/mobile/auth/me: el mobile cachea
        // country/timezone/currency last-write-wins de ambas fuentes.
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
          school: user.school,
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
