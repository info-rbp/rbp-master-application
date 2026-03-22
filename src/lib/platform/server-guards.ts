import { redirect } from 'next/navigation';
import type { PlatformSessionResponse } from './types';
import { resolveSessionResponse } from './session';
import { getRouteAccess } from './route-access';

export function evaluateRouteAuthorization(pathname: string, response: PlatformSessionResponse) {
  const access = getRouteAccess(pathname);
  if (access.kind === 'public') return { allowed: true as const, reason: 'public' as const };
  if (!response.authenticated) return { allowed: false as const, reason: 'unauthenticated' as const, redirectTo: access.loginPath ?? '/login' };
  if ((access.kind === 'module' || access.kind === 'admin') && !response.session.enabledModules.includes(access.moduleKey!)) {
    return { allowed: false as const, reason: 'access_denied' as const, redirectTo: '/access-denied' };
  }
  return { allowed: true as const, reason: 'authorized' as const };
}

export async function requireSessionForPath(pathname: string) {
  const response = await resolveSessionResponse();
  const decision = evaluateRouteAuthorization(pathname, response);
  if (!decision.allowed) {
    redirect(decision.redirectTo);
  }
  return response;
}
