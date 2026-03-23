import { redirect } from 'next/navigation';
import type { PlatformSessionResponse } from './types';
import { resolveSessionResponse } from './session';
import { evaluateRoutePolicyAccess } from '@/lib/access/evaluators';

export function evaluateRouteAuthorization(pathname: string, response: PlatformSessionResponse) {
  if (!response.authenticated) {
    return { allowed: false as const, reason: 'unauthenticated' as const, redirectTo: '/login' };
  }
  const context = { environment: process.env.NODE_ENV ?? 'development', tenantId: response.session.activeTenant.id, workspaceId: response.session.activeWorkspace?.id, userId: response.session.user.id, roleCodes: response.session.roles.map((role) => role.code), enabledModules: response.session.enabledModules as string[], effectiveFlags: response.session.featureFlags, effectivePermissions: response.session.effectivePermissions, internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal'), correlationId: response.session.sessionId, activeRoute: pathname };
  const { policy, result } = evaluateRoutePolicyAccess(pathname, context);
  if (result.allowed) return { allowed: true as const, reason: 'authorized' as const };
  return { allowed: false as const, reason: 'access_denied' as const, redirectTo: policy?.accessDeniedBehavior === 'redirect_login' ? '/login' : '/access-denied' };
}

export async function requireSessionForPath(pathname: string) {
  const response = await resolveSessionResponse();
  if (!response.authenticated) redirect('/login');
  const decision = evaluateRouteAuthorization(pathname, response);
  if (!decision.allowed) redirect(decision.redirectTo);
  return response;
}
