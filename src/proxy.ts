import { auth } from './auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const user = req.auth?.user as any;

  const isLoginRoute = nextUrl.pathname === '/login';
  const isAccountRoute = nextUrl.pathname === '/account';
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isApiRoute = nextUrl.pathname.startsWith('/api');

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (!isLoginRoute) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next();
  }

  // User is logged in
  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Force must_change_password redirect to /account
  if (user?.mustChangePassword && !isAccountRoute) {
    return NextResponse.redirect(new URL('/account?mustChange=true', nextUrl));
  }

  // Admin page role restriction
  if (isAdminRoute && user?.role !== 'superuser') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
