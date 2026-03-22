import { getAllModules, getModuleByKey } from './module-registry';
import { canPermission } from './permissions';
import type { ModuleAccessResult, ModuleDefinition, NavigationContext, PermissionGrant, Tenant, Workspace } from './types';

function hasTenantCapability(tenant: Tenant, capability: string) {
  return Boolean(tenant.settings?.[capability] || tenant.securityPolicy?.[capability] || tenant.branding?.[capability]);
}

export function evaluateModuleAccess(module: ModuleDefinition | undefined, context: NavigationContext): ModuleAccessResult {
  if (!module) {
    return {
      moduleKey: 'home',
      exists: false,
      enabledForTenant: false,
      enabledByFeatureFlags: false,
      allowedByPermissions: false,
      allowedByWorkspace: false,
      hidden: true,
      internalOnly: false,
      visible: false,
      accessible: false,
      reasonCodes: ['module_not_found'],
    };
  }

  const tenant = context.activeTenant;
  const enabledForTenant = !tenant
    ? module.isEnabledByDefault
    : tenant.enabledModules.includes(module.key) || module.isEnabledByDefault;
  const enabledByFeatureFlags = module.requiredFeatureFlags.every((flag) => Boolean(context.featureFlags[flag]));
  const allowedByPermissions = module.requiredPermissions.every((permission) =>
    canPermission(context.effectivePermissions, permission.resource, permission.action),
  );
  const allowedByWorkspace =
    !context.activeWorkspace ||
    module.allowedWorkspaceTypes.length === 0 ||
    module.allowedWorkspaceTypes.includes(context.activeWorkspace.workspaceType);
  const tenantCapabilitiesMet =
    !tenant || module.requiredTenantCapabilities.every((capability) => hasTenantCapability(tenant, capability));
  const hidden = module.isHidden;
  const internalOnly = module.isInternalOnly;
  const internalRuleSatisfied = !module.isInternalOnly || context.internalUser;
  const visible = enabledForTenant && enabledByFeatureFlags && allowedByWorkspace && tenantCapabilitiesMet && internalRuleSatisfied && !hidden;
  const accessible = visible && allowedByPermissions;

  const reasonCodes = [
    !enabledForTenant ? 'tenant_module_disabled' : null,
    !enabledByFeatureFlags ? 'missing_feature_flag' : null,
    !allowedByPermissions ? 'missing_permission' : null,
    !allowedByWorkspace ? 'workspace_not_allowed' : null,
    !tenantCapabilitiesMet ? 'missing_tenant_capability' : null,
    module.isInternalOnly && !context.internalUser ? 'internal_only' : null,
    hidden ? 'hidden' : null,
  ].filter((value): value is string => Boolean(value));

  return {
    moduleKey: module.key,
    exists: true,
    enabledForTenant,
    enabledByFeatureFlags,
    allowedByPermissions,
    allowedByWorkspace,
    hidden,
    internalOnly,
    visible,
    accessible,
    reasonCodes,
  };
}

export function listVisibleModules(context: NavigationContext) {
  return getAllModules().filter((module) => evaluateModuleAccess(module, context).visible);
}

export function evaluateEnabledModules(input: {
  tenant: Tenant;
  workspace?: Workspace;
  permissions: PermissionGrant[];
  internalUser: boolean;
}) {
  const context: NavigationContext = {
    session: null,
    activeTenant: input.tenant,
    activeWorkspace: input.workspace,
    effectivePermissions: input.permissions,
    enabledModules: input.tenant.enabledModules as NavigationContext['enabledModules'],
    featureFlags: input.tenant.featureFlags,
    internalUser: input.internalUser,
  };

  return listVisibleModules(context).filter((module) => evaluateModuleAccess(module, context).accessible);
}

export function getModuleAccessSummary(context: NavigationContext) {
  return getAllModules().map((module) => evaluateModuleAccess(module, context));
}

export function hasModuleAccess(context: NavigationContext, moduleKey: ModuleDefinition['key']) {
  return evaluateModuleAccess(getModuleByKey(moduleKey), context).accessible;
}
