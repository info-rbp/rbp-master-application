import { getModuleByKey } from './module-registry';
import { evaluateModuleAccess, hasModuleAccess } from './modules';
import { canPermission } from './permissions';
import { getAllRouteDefinitions, getRouteDefinition, listRoutesForModule } from './route-definitions';
import type { NavigationContext, RouteDefinition } from './types';

function hasTenantCapability(context: NavigationContext, capability: string) {
  return Boolean(context.activeTenant?.settings?.[capability] || context.activeTenant?.securityPolicy?.[capability]);
}

export function canAccessRoute(routeDefinition: RouteDefinition | undefined, context: NavigationContext) {
  if (!routeDefinition || !routeDefinition.isEnabled) {
    return { allowed: false as const, reasonCodes: ['route_not_found'], routeDefinition };
  }

  const requiresAuth = routeDefinition.routeType !== 'public' && !routeDefinition.allowAnonymous;
  if (requiresAuth && !context.session) {
    return { allowed: false as const, reasonCodes: ['unauthenticated'], routeDefinition };
  }

  const requiredModulesMet = routeDefinition.requiredModules.every((moduleKey) => hasModuleAccess(context, moduleKey));
  const requiredPermissionsMet = routeDefinition.requiredPermissions.every((permission) =>
    canPermission(context.effectivePermissions, permission.resource, permission.action),
  );
  const featureFlagsMet = routeDefinition.requiredFeatureFlags.every((flag) => Boolean(context.featureFlags[flag]));
  const tenantCapabilitiesMet = routeDefinition.requiredTenantCapabilities.every((capability) => hasTenantCapability(context, capability));
  const moduleAccess = evaluateModuleAccess(getModuleByKey(routeDefinition.moduleKey), context);

  const allowed = moduleAccess.accessible && requiredModulesMet && requiredPermissionsMet && featureFlagsMet && tenantCapabilitiesMet;
  const reasonCodes = [
    !moduleAccess.exists ? 'module_not_found' : null,
    !moduleAccess.accessible ? moduleAccess.reasonCodes[0] ?? 'module_inaccessible' : null,
    !requiredModulesMet ? 'required_module_missing' : null,
    !requiredPermissionsMet ? 'missing_permission' : null,
    !featureFlagsMet ? 'missing_feature_flag' : null,
    !tenantCapabilitiesMet ? 'missing_tenant_capability' : null,
  ].filter((value): value is string => Boolean(value));

  return { allowed, reasonCodes, routeDefinition, moduleAccess };
}

export function getDefaultLandingRoute(context: NavigationContext) {
  const preferred = getAllRouteDefinitions().find((routeDefinition) => {
    if (!routeDefinition.isDefaultLanding) return false;
    if (context.session && routeDefinition.routeType === 'public') return false;
    return canAccessRoute(routeDefinition, context).allowed;
  });

  return preferred?.path ?? '/';
}

export function getVisibleRoutesForModule(moduleKey: RouteDefinition['moduleKey'], context: NavigationContext) {
  return listRoutesForModule(moduleKey)
    .filter((routeDefinition) => !routeDefinition.hideFromNav)
    .filter((routeDefinition) => canAccessRoute(routeDefinition, context).allowed)
    .sort((a, b) => a.order - b.order);
}

export { getAllRouteDefinitions, getRouteDefinition };
