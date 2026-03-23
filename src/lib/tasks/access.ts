import { canPermission } from '@/lib/platform/permissions';
import type { ModuleDefinition } from '@/lib/platform/types';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';

const modulePermissions: Record<ModuleDefinition['key'], { resource: string; action: string; internalOnly?: boolean }> = {
  dashboard: { resource: 'dashboard', action: 'read' },
  customers: { resource: 'customer', action: 'read', internalOnly: true },
  applications: { resource: 'application', action: 'read', internalOnly: true },
  loans: { resource: 'loan', action: 'read', internalOnly: true },
  documents: { resource: 'document', action: 'read' },
  finance: { resource: 'finance', action: 'read', internalOnly: true },
  support: { resource: 'support_ticket', action: 'read' },
  analytics: { resource: 'analytics', action: 'read' },
  knowledge: { resource: 'knowledge', action: 'read' },
  settings: { resource: 'settings', action: 'read' },
  admin: { resource: 'admin_user', action: 'read', internalOnly: true },
};

export function canAccessTaskModule(context: BffRequestContext, moduleKey: ModuleDefinition['key']) {
  const rule = modulePermissions[moduleKey];
  if (!rule) return false;
  if (rule.internalOnly && !context.internalUser) return false;
  if (!context.session.enabledModules.includes(moduleKey)) return false;
  return canPermission(context.session.effectivePermissions, rule.resource, rule.action);
}
