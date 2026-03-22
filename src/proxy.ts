import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PLATFORM_SESSION_COOKIE } from '@/lib/platform/session-store';
import { getRouteAccess } from '@/lib/platform/route-access';

export function proxy(request: NextRequest) {
  const access = getRouteAccess(request.nextUrl.pathname);
  if (access.kind === 'public') {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(access.loginPath ?? '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/admin/:path*', '/settings/:path*', '/account', '/forum', '/member-dashboard'],
};
