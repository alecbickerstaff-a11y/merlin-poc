import { NextResponse, type NextRequest } from 'next/server';

/**
 * Simple password-gate middleware.
 * If SITE_PASSWORD env var is set, every request (except /login, /api/auth,
 * and static assets) must carry a valid `merlin_session` cookie.
 * If the var is empty / unset the gate is disabled — wide open.
 */
export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;

  // Gate disabled — let everything through
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Always allow: login page, auth endpoint, Next.js internals, static files
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('merlin_session')?.value;
  if (session === password) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
