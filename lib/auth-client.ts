import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// El panel se sirve en dos hosts (apex eez4us.com y www.eez4us.com, ambos Custom Domains
// directos). El authClient DEBE pegar al mismo host donde se cargó la página: si horneamos
// un host fijo (NEXT_PUBLIC_APP_URL = apex) y el usuario entra por www, el sign-in es
// cross-origin, el preflight no trae Access-Control-Allow-Origin y el fetch muere con
// "Failed to fetch". Con window.location.origin siempre es same-origin (el server acepta
// ambos hosts). En SSR (sin window) cae al env; el sign-in real corre en el browser.
const runtimeBaseURL =
  typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({
  baseURL: runtimeBaseURL,
  // El challenge OTP se maneja inline en /login (paso 'otp'), no con redirect a otra página.
  plugins: [twoFactorClient()],
});
