import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PLATFORM_SESSION_COOKIE } from '@/lib/platform/session-store';
import { getRouteAccess } from '@/lib/platform/route-access';
import { matchRoutePolicy } from '@/lib/access/route-policies';

export function proxy(request: NextRequest) {
  const policy = matchRoutePolicy(request.nextUrl.pathname);
  if (policy) {
    const sessionCookie = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
    if (!sessionCookie && policy.accessDeniedBehavior === 'redirect_login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const access = getRouteAccess(request.nextUrl.pathname);
  if (access.kind === 'public') return NextResponse.next();
  const sessionCookie = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!sessionCookie) return NextResponse.redirect(new URL(access.loginPath ?? '/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/admin/:path*', '/settings/:path*', '/account', '/forum', '/member-dashboard', '/api/:path*'],
};
