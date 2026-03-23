import { evaluateSubFeatureAccess } from './evaluators';
import type { PlatformSession } from '@/lib/platform/types';

export function canSubFeature(session: PlatformSession | null, internalUser: boolean, subFeatureKey: string) {
  if (!session) return false;
  return evaluateSubFeatureAccess(subFeatureKey, { environment: process.env.NODE_ENV ?? 'development', tenantId: session.activeTenant.id, workspaceId: session.activeWorkspace?.id, userId: session.user.id, roleCodes: session.roles.map((role) => role.code), enabledModules: session.enabledModules as string[], effectiveFlags: session.featureFlags, effectivePermissions: session.effectivePermissions, internalUser, correlationId: session.sessionId }).result.allowed;
}
