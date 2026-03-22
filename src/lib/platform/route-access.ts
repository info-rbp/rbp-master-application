import type { ModuleDefinition } from './types';

export type RouteAccess = {
  kind: 'public' | 'authenticated' | 'module' | 'admin';
  moduleKey?: ModuleDefinition['key'];
  loginPath?: string;
};

const routeRules: Array<{ prefix: string; access: RouteAccess }> = [
  { prefix: '/admin', access: { kind: 'admin', moduleKey: 'admin', loginPath: '/login?next=/admin' } },
  { prefix: '/portal/support', access: { kind: 'module', moduleKey: 'support', loginPath: '/login?next=/portal/support' } },
  { prefix: '/portal', access: { kind: 'authenticated', loginPath: '/login?next=/portal' } },
  { prefix: '/settings', access: { kind: 'module', moduleKey: 'settings', loginPath: '/login?next=/settings/profile' } },
  { prefix: '/dashboard', access: { kind: 'module', moduleKey: 'dashboard', loginPath: '/login?next=/dashboard' } },
  { prefix: '/account', access: { kind: 'authenticated', loginPath: '/login?next=/account' } },
  { prefix: '/forum', access: { kind: 'authenticated', loginPath: '/login?next=/forum' } },
  { prefix: '/member-dashboard', access: { kind: 'authenticated', loginPath: '/login?next=/member-dashboard' } },
];

export function getRouteAccess(pathname: string): RouteAccess {
  const match = routeRules.find((rule) => pathname.startsWith(rule.prefix));
  return match?.access ?? { kind: 'public' };
}
