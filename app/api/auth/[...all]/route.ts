import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

// Self-signup tradicional deshabilitado: los padres SOLO entran vía claim de invitación
// (/api/auth/claim-invitation) y el staff lo crea el panel. Las altas internas usan
// auth.api.signUpEmail() server-side, que no pasa por este handler HTTP.
export async function POST(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/sign-up/email')) {
    return Response.json({ error: 'SIGNUP_DISABLED' }, { status: 403 });
  }
  return handlers.POST(req);
}
