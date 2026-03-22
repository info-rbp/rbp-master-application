import { getAllModules, listModulesByNavGroup } from './module-registry';
import { getVisibleRoutesForModule } from './route-access';
import { evaluateModuleAccess } from './modules';
import type { NavigationContext, NavigationGroupKey, NavigationItem } from './types';

function toNavigationItem(moduleKey: NavigationItem['moduleKey'], context: NavigationContext, labelOverride?: string): NavigationItem | null {
  const module = getAllModules().find((item) => item.key === moduleKey);
  if (!module) return null;
  const access = evaluateModuleAccess(module, context);
  if (!access.visible) return null;
  const routes = getVisibleRoutesForModule(module.key, context);
  const primaryRoute = routes.find((routeDefinition) => routeDefinition.isDefaultLanding) ?? routes[0];
  return {
    id: `nav.${module.key}`,
    label: labelOverride ?? module.name,
    type: 'module',
    route: primaryRoute?.path ?? module.defaultLandingRoute,
    icon: module.icon,
    moduleKey: module.key,
    visible: true,
    disabled: !access.accessible,
    order: module.order,
    badge: module.badges?.[0]?.label,
    children: routes.map((routeDefinition) => ({
      id: routeDefinition.id,
      label: routeDefinition.label,
      type: 'route',
      route: routeDefinition.path,
      icon: routeDefinition.icon,
      moduleKey: routeDefinition.moduleKey,
      visible: true,
      disabled: false,
      order: routeDefinition.order,
      children: [],
      meta: { navGroup: routeDefinition.navGroup },
    })),
    meta: {
      isBeta: module.isBeta,
      tooltip: module.description,
      navGroup: module.navGroup,
    },
  };
}

function buildNavigationGroup(group: NavigationGroupKey, context: NavigationContext) {
  return listModulesByNavGroup(group)
    .map((module) => toNavigationItem(module.key, context))
    .filter((item): item is NavigationItem => Boolean(item))
    .sort((a, b) => a.order - b.order);
}

export function buildPrimaryNavigation(context: NavigationContext) {
  return buildNavigationGroup(context.session ? 'primary' : 'public', context);
}

export function buildSecondaryNavigation(context: NavigationContext) {
  return buildNavigationGroup('secondary', context);
}

export function buildPublicNavigation(context: NavigationContext) {
  return buildNavigationGroup('public', context);
}

export function buildWorkspaceNavigation(context: NavigationContext) {
  return buildNavigationGroup('workspace', context);
}

export function buildAdminNavigation(context: NavigationContext) {
  return buildNavigationGroup('admin', context);
}

export function buildUserMenuNavigation(context: NavigationContext) {
  return buildNavigationGroup('user', context);
}
