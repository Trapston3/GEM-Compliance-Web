import { auth } from './auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  let isLoggedIn = false;
  let user: any = null;

  try {
    user = req.auth?.user;
    isLoggedIn = !!user;
  } catch (err) {
    console.error(`[AUTH PROXY ERROR] Failed to resolve session for ${pathname}:`, err);
    isLoggedIn = false;
    user = null;
  }

  // Defensive logging for Vercel
  console.log(`[AUTH PROXY] Request details:`, {
    pathname,
    isLoggedIn,
    userId: user?.id,
    userRole: user?.role,
    mustChangePassword: user?.mustChangePassword,
  });

  const isLoginRoute = pathname === '/login';
  const isAccountRoute = pathname === '/account';
  const isAdminRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset = pathname.startsWith('/favicon.ico') || pathname.startsWith('/_next') || pathname.startsWith('/static');

  if (isApiRoute || isPublicAsset) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (!isLoginRoute) {
      console.log(`[AUTH PROXY REDIRECT] Redirecting unauthenticated user from ${pathname} to /login`);
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next();
  }

  // User is logged in
  if (isLoginRoute) {
    console.log(`[AUTH PROXY REDIRECT] Redirecting already authenticated user from /login to /`);
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Force must_change_password redirect to /account
  if (user?.mustChangePassword && !isAccountRoute) {
    console.log(`[AUTH PROXY REDIRECT] Redirecting user with mustChangePassword flag from ${pathname} to /account`);
    return NextResponse.redirect(new URL('/account?mustChange=true', nextUrl));
  }

  // Admin page role restriction
  if (isAdminRoute && user?.role !== 'superuser') {
    console.log(`[AUTH PROXY REDIRECT] Redirecting non-superuser from ${pathname} to /`);
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
