import { redirect } from 'next/navigation';
import type { PlatformSessionResponse } from './types';
import { resolveSessionResponse } from './session';
import { matchRoutePolicy } from '@/lib/access/route-policies';
import { hasCapability } from '@/lib/access/capabilities';

export function evaluateRouteAuthorization(pathname: string, response: PlatformSessionResponse) {
  const policy = matchRoutePolicy(pathname);
  if (!policy) return { allowed: true as const, reason: 'public' as const };
  if (!response.authenticated) return { allowed: false as const, reason: 'unauthenticated' as const, redirectTo: '/login' };
  const context = { environment: process.env.NODE_ENV ?? 'development', tenantId: response.session.activeTenant.id, workspaceId: response.session.activeWorkspace?.id, userId: response.session.user.id, roleCodes: response.session.roles.map((role) => role.code), enabledModules: response.session.enabledModules as string[], effectiveFlags: response.session.featureFlags, effectivePermissions: response.session.effectivePermissions, internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal'), correlationId: response.session.sessionId, activeRoute: pathname };
  const allowed = policy.requiredCapabilities.every((capability) => hasCapability(context, capability));
  return allowed ? { allowed: true as const, reason: 'authorized' as const } : { allowed: false as const, reason: 'access_denied' as const, redirectTo: '/access-denied' };
}

export async function requireSessionForPath(pathname: string) {
  const response = await resolveSessionResponse();
  const decision = evaluateRouteAuthorization(pathname, response);
  if (!decision.allowed) {
    redirect(decision.redirectTo);
  }
  return response;
}
