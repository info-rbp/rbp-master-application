import { AuditService } from '@/lib/audit/service';
import { BffApiError, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { getActionPolicy } from './action-policies';
import { hasCapability } from './capabilities';
import { matchRoutePolicy } from './route-policies';
import { getSubFeature } from './sub-features';
import type { AccessEvaluationContext, AccessEvaluationResult, ActionPolicyDefinition, CapabilityKey, RoutePolicyDefinition } from './types';

export function toAccessContext(context: BffRequestContext, extra: Partial<AccessEvaluationContext> = {}): AccessEvaluationContext {
  return { environment: process.env.NODE_ENV ?? 'development', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, userId: context.session.user.id, roleCodes: context.session.roles.map((role) => role.code), enabledModules: context.session.enabledModules as string[], effectiveFlags: context.session.featureFlags, effectivePermissions: context.session.effectivePermissions, internalUser: context.internalUser, correlationId: context.correlationId, ...extra };
}

function evaluateRequirements(input: { source: string; requiredCapabilities: CapabilityKey[]; requiredFlags: string[]; requiredModules: string[]; context: AccessEvaluationContext; internalOnly?: boolean; }) : AccessEvaluationResult {
  const missingCapabilities = input.requiredCapabilities.filter((capability) => !hasCapability(input.context, capability));
  const missingFlags = input.requiredFlags.filter((flag) => !input.context.effectiveFlags[flag]);
  const missingModules = input.requiredModules.filter((moduleKey) => !input.context.enabledModules.includes(moduleKey));
  const reasonCodes = [] as string[];
  if (input.internalOnly && !input.context.internalUser) reasonCodes.push('internal_only');
  if (missingCapabilities.length) reasonCodes.push('missing_capability');
  if (missingFlags.length) reasonCodes.push('missing_flag');
  if (missingModules.length) reasonCodes.push('missing_module');
  return { allowed: reasonCodes.length === 0, source: input.source, requiredCapabilities: input.requiredCapabilities, missingCapabilities, requiredFlags: input.requiredFlags, missingFlags, requiredModules: input.requiredModules, missingModules, reasonCodes, conditionsPassed: true, visibilitySuggestion: input.internalOnly && !input.context.internalUser ? 'internal_only' : missingCapabilities.length || missingFlags.length || missingModules.length ? 'disabled' : 'visible' };
}

export function evaluateRoutePolicyAccess(pathname: string, context: AccessEvaluationContext) {
  const policy = matchRoutePolicy(pathname);
  if (!policy) return { policy: null, result: { allowed: true, source: 'implicit_public', requiredCapabilities: [], missingCapabilities: [], requiredFlags: [], missingFlags: [], requiredModules: [], missingModules: [], reasonCodes: [], conditionsPassed: true, visibilitySuggestion: 'visible' } as AccessEvaluationResult };
  return { policy, result: evaluateRequirements({ source: policy.id, requiredCapabilities: policy.requiredCapabilities, requiredFlags: policy.requiredFeatureFlags, requiredModules: policy.requiredModuleControls, context, internalOnly: policy.internalOnly }) };
}

export async function requireRoutePolicyAccess(pathname: string, context: BffRequestContext) {
  const { policy, result } = evaluateRoutePolicyAccess(pathname, toAccessContext(context, { activeRoute: pathname }));
  if (!result.allowed) throw new BffApiError('forbidden', 'Route access denied.', 403, { pathname, policyId: policy?.id, reasonCodes: result.reasonCodes });
  return { policy, result };
}

export function evaluateActionPolicyAccess(actionKey: string, context: AccessEvaluationContext) {
  const policy = getActionPolicy(actionKey);
  if (!policy) return { policy: null, result: { allowed: true, source: 'unconfigured_action', requiredCapabilities: [], missingCapabilities: [], requiredFlags: [], missingFlags: [], requiredModules: [], missingModules: [], reasonCodes: [], conditionsPassed: true, degraded: true, visibilitySuggestion: 'visible' } as AccessEvaluationResult };
  return { policy, result: evaluateRequirements({ source: policy.id, requiredCapabilities: policy.requiredCapabilities, requiredFlags: policy.requiredFeatureFlags, requiredModules: policy.requiredModuleControls, context, internalOnly: policy.internalOnly }) };
}

export async function requireActionPolicyAccess(actionKey: string, context: BffRequestContext) {
  const { policy, result } = evaluateActionPolicyAccess(actionKey, toAccessContext(context));
  if (policy?.auditOnAttempt) await new AuditService().record({ eventType: 'access.attempt', action: actionKey, category: 'authorization', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'action_policy', subjectEntityId: actionKey, sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'attempted', severity: policy.highRisk ? 'warning' : 'info', metadata: { policyId: policy.id }, sensitivity: 'internal' });
  if (!result.allowed) {
    if (policy?.auditOnDeny) await new AuditService().record({ eventType: 'access.denied', action: actionKey, category: 'authorization', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'action_policy', subjectEntityId: actionKey, sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'denied', severity: policy.highRisk ? 'warning' : 'info', metadata: { policyId: policy.id, reasonCodes: result.reasonCodes }, sensitivity: 'internal' });
    throw new BffApiError('forbidden', 'Action access denied.', 403, { actionKey, policyId: policy?.id, reasonCodes: result.reasonCodes });
  }
  return { policy, result };
}

export function evaluateSubFeatureAccess(subFeatureKey: string, context: AccessEvaluationContext) {
  const def = getSubFeature(subFeatureKey); if (!def) return { definition: null, result: { allowed: true, source: 'unconfigured_subfeature', requiredCapabilities: [], missingCapabilities: [], requiredFlags: [], missingFlags: [], requiredModules: [], missingModules: [], reasonCodes: [], conditionsPassed: true, degraded: true, visibilitySuggestion: 'visible' } as AccessEvaluationResult };
  return { definition: def, result: evaluateRequirements({ source: def.key, requiredCapabilities: def.requiredCapabilities, requiredFlags: def.requiredFeatureFlags, requiredModules: [def.moduleKey], context, internalOnly: def.internalOnly }) };
}

export async function requireSubFeatureAccess(subFeatureKey: string, context: BffRequestContext) {
  const { definition, result } = evaluateSubFeatureAccess(subFeatureKey, toAccessContext(context));
  if (!result.allowed) throw new BffApiError('forbidden', 'Sub-feature access denied.', 403, { subFeatureKey, definition: definition?.key, reasonCodes: result.reasonCodes });
  return { definition, result };
}
