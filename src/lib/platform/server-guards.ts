import { redirect } from 'next/navigation';
import { createNavigationContextFromSession } from './navigation-context';
import { canAccessRoute, getDefaultLandingRoute, getRouteDefinition } from './route-access';
import type { PlatformSessionResponse } from './types';
import { resolveSessionResponse } from './session';

export function evaluateRouteAuthorization(pathname: string, response: PlatformSessionResponse) {
  const context = createNavigationContextFromSession(response.authenticated ? response.session : null, pathname);
  const routeDefinition = getRouteDefinition(pathname);
  const access = canAccessRoute(routeDefinition, context);

  if (access.allowed) {
    return { allowed: true as const, reason: 'authorized' as const, routeDefinition };
  }

  if (access.reasonCodes.includes('unauthenticated')) {
    return { allowed: false as const, reason: 'unauthenticated' as const, redirectTo: `/login?next=${pathname}`, routeDefinition };
  }

  if (!routeDefinition) {
    return { allowed: false as const, reason: 'access_denied' as const, redirectTo: '/access-denied', routeDefinition };
  }

  if (routeDefinition.accessDeniedBehavior === 'redirect') {
    return { allowed: false as const, reason: 'redirect' as const, redirectTo: getDefaultLandingRoute(context), routeDefinition };
  }

  return { allowed: false as const, reason: 'access_denied' as const, redirectTo: '/access-denied', routeDefinition };
}

export async function requireSessionForPath(pathname: string) {
  const response = await resolveSessionResponse();
  const decision = evaluateRouteAuthorization(pathname, response);
  if (!decision.allowed) {
    redirect(decision.redirectTo);
  }
  return response;
}
