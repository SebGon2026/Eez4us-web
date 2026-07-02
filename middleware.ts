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
const PUBLIC_PREFIXES = ['/dev/', '/api/public/'];

// Páginas de auth: si ya hay sesión, mandamos directo al panel.
// Esto rompe la cadena /login → / → /admin y previene el "flicker" del
// back-forward cache cuando el usuario vuelve atrás después de loguearse.
const AUTH_PAGES = new Set(['/login', '/forgot-password', '/reset-password']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);

  const isPublic =
    PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authed && AUTH_PAGES.has(pathname)) {
    const response = NextResponse.redirect(new URL('/admin', request.url));
    response.headers.set('cache-control', 'no-store, must-revalidate');
    return response;
  }

  // Páginas autenticadas: nunca cachear (evita back/forward cache stale).
  if (authed && !isPublic) {
    // x-pathname: los layouts server-side no ven la URL; el gate de billing del layout
    // admin lo necesita para no redirigir en loop sobre /admin/billing.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('cache-control', 'no-store, must-revalidate');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\..*).*)'],
};
