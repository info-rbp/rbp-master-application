import type { NavigationContext, PlatformSession } from './types';

export function createNavigationContextFromSession(session: PlatformSession | null, currentRoute?: string): NavigationContext {
  return {
    session,
    activeTenant: session?.activeTenant,
    activeWorkspace: session?.activeWorkspace,
    effectivePermissions: session?.effectivePermissions ?? [],
    enabledModules: session?.enabledModules ?? ['home', 'services', 'knowledge', 'offers', 'docushare', 'help'],
    featureFlags: session?.featureFlags ?? {},
    internalUser: session?.activeTenant.tenantType === 'internal' || Boolean(session?.availableTenants.some((tenant) => tenant.tenantType === 'internal')),
    currentRoute,
  };
}
