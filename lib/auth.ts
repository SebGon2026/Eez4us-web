import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { bearer, jwt, twoFactor } from 'better-auth/plugins';

import { prisma } from './db';
import { LOCALE_COOKIE, resolveLocale, type AppLocale } from './locale';
import { sendResetPasswordEmail, sendStaffOtpEmail } from './mailer';

// Idioma para los emails de auth (OTP 2FA / reset): sale de los headers del request
// que dispara el envío (cookie NEXT_LOCALE → geo-IP → Accept-Language). Sin headers
// (jobs internos), cae al default 'es'.
function localeFromHeaders(headers: Headers | null | undefined): AppLocale {
  if (!headers) return 'es';
  const cookieHeader = headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(es|en)(?:;|\\s|$)`));
  return resolveLocale({
    cookie: match?.[1] ?? null,
    ipCountry: headers.get('cf-ipcountry'),
    acceptLanguage: headers.get('accept-language'),
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // El panel se sirve en apex Y www (dos Custom Domains directos, sin redirect — el mobile
  // exige www sin 308). better-auth por defecto solo confía en baseURL (apex), así que un
  // login desde www daba 403 "Invalid origin". Declaramos ambos hosts como confiables.
  // BETTER_AUTH_URL cubre el caso dev (localhost).
  trustedOrigins: [
    'https://eez4us.com',
    'https://www.eez4us.com',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }, request) => {
      // El cliente solo recibe un genérico "si existe el email te mandamos un link".
      await sendResetPasswordEmail({
        email: user.email,
        link: url,
        locale: localeFromHeaders(request?.headers),
      });
    },
  },
  user: {
    additionalFields: {
      schoolId: { type: 'string', required: false },
      role: {
        type: 'string',
        defaultValue: 'parent',
        input: false,
      },
      phoneE164: { type: 'string', required: false },
    },
  },
  plugins: [
    bearer(),
    // 2FA por email para staff del panel (director/super_admin). TOTP deshabilitado: el
    // único método es el OTP de 6 dígitos por correo. Se fuerza con User.twoFactorEnabled
    // al crear el usuario — no hay flujo de opt-in. Los parents nunca lo tienen activo.
    twoFactor({
      totpOptions: { disable: true },
      otpOptions: {
        period: 5, // minutos de vida del código
        sendOTP: async ({ user, otp }, ctx) => {
          await sendStaffOtpEmail({
            email: user.email,
            otp,
            locale: localeFromHeaders(ctx?.request?.headers ?? ctx?.headers),
          });
        },
      },
    }),
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          sub: user.id,
          schoolId: (user as { schoolId?: string | null }).schoolId ?? null,
          role: (user as { role?: string }).role ?? 'parent',
        }),
      },
    }),
  ],
});

export type Auth = typeof auth;
