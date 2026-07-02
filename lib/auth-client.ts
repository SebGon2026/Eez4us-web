import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // El challenge OTP se maneja inline en /login (paso 'otp'), no con redirect a otra página.
  plugins: [twoFactorClient()],
});
