import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { bearer, jwt, twoFactor } from 'better-auth/plugins';

import { prisma } from './db';
import { sendResetPasswordEmail, sendStaffOtpEmail } from './mailer';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // El cliente solo recibe un genérico "si existe el email te mandamos un link".
      await sendResetPasswordEmail({ email: user.email, link: url });
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
        sendOTP: async ({ user, otp }) => {
          await sendStaffOtpEmail({ email: user.email, otp });
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
