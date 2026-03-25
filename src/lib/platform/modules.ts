import { listModuleDefinitions } from './bootstrap';
import { canPermission } from './permissions';
import type { ModuleDefinition, NavigationItem, PermissionGrant, Tenant, Workspace } from './types';

export function evaluateEnabledModules(input: {
  tenant: Tenant;
  workspace?: Workspace;
  permissions: PermissionGrant[];
  internalUser: boolean;
}): ModuleDefinition[] {
  return listModuleDefinitions().filter((module) => {
    if (module.isHidden) return false;
    if (module.isInternalOnly && !input.internalUser) return false;
    const tenantEnabled = input.tenant.enabledModules.includes(module.key) || module.isEnabledByDefault;
    if (!tenantEnabled) return false;
    const featureFlagsEnabled = module.requiredFeatureFlags.every((flag) => Boolean((input.tenant.featureFlags ?? {})[flag]));
    if (!featureFlagsEnabled) return false;
    if (input.workspace && module.workspaceTypes?.length && !module.workspaceTypes.includes(input.workspace.workspaceType)) {
      return false;
    }
    if (input.workspace && input.workspace.enabledModules.length > 0 && !input.workspace.enabledModules.includes(module.key)) {
      return false;
    }
    return module.requiredPermissions.every((permission) =>
      canPermission(input.permissions, permission.resource, permission.action),
    );
  });
}

export function buildNavigation(modules: ModuleDefinition[]): NavigationItem[] {
  return modules.map((module) => ({
    id: `nav_${module.key}`,
    label: module.name,
    route: module.route,
    moduleKey: module.key,
    icon: module.icon,
    type: 'route',
    visible: true,
    children: [],
  }));
}

export function hasModule(enabledModules: ModuleDefinition[], key: ModuleDefinition['key']) {
  return enabledModules.some((module) => module.key === key);
}


export function evaluateModuleAccess(module: ModuleDefinition, input: {
  tenant?: Tenant;
  workspace?: Workspace;
  permissions?: PermissionGrant[];
  internalUser?: boolean;
}): { visible: boolean; accessible: boolean } {
  const enabled = input.tenant
    ? evaluateEnabledModules({
        tenant: input.tenant,
        workspace: input.workspace,
        permissions: input.permissions ?? [],
        internalUser: Boolean(input.internalUser),
      }).some((item) => item.key === module.key)
    : !module.isInternalOnly;

  return {
    visible: enabled,
    accessible: enabled,
  };
}
