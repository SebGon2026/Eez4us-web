import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function hasSessionCookie(request: NextRequest): boolean {
  // En producción (HTTPS) better-auth prefija la cookie de sesión con `__Secure-`
  // (y podría usar `__Host-`), así que startsWith('better-auth') daba false y rebotaba
  // a /login en loop. Matcheamos el nombre con o sin prefijo.
  return request.cookies.getAll().some((c) => c.name.includes('better-auth.session_token'));
}

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
]);
// /invite/{token}: claim público de invitaciones de padres (el link del email cae acá).
const PUBLIC_PREFIXES = ['/dev/', '/api/public/', '/invite/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);

  const isPublic =
    PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // OJO: NO redirigir /login → /admin por "hay cookie". El middleware corre en el edge y
  // no puede validar la sesión (solo ve que la cookie existe). Si la cookie quedó huérfana
  // (sesión borrada/expirada), /login mandaba a /admin y el layout de /admin rebotaba a
  // /login → ERR_TOO_MANY_REDIRECTS. Dejamos que /login renderice siempre; el propio login
  // hace window.location.replace('/admin') tras autenticar, así que no hay doble paso real.

  // Páginas autenticadas: nunca cachear (evita back/forward cache stale).
  // OJO: NO reescribir los headers del request con NextResponse.next({ request: { headers } }).
  // En OpenNext/Workers eso hacía que el layout server-side NO recibiera la cookie de sesión,
  // así getCurrentSession() daba null y /admin rebotaba a /login pese a tener sesión válida.
  // (Antes se inyectaba x-pathname para el bloqueo por mora del layout; ese bloqueo está
  // apagado por flag y fail-open, así que no se pierde nada. Si se reactiva, detectar el
  // pathname sin reescribir headers del request.)
  if (authed && !isPublic) {
    const response = NextResponse.next();
    response.headers.set('cache-control', 'no-store, must-revalidate');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\..*).*)'],
};
