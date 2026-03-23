import { canPermission } from '@/lib/platform/permissions';
import type { ModuleDefinition } from '@/lib/platform/types';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import type { SearchEntityType } from './types';

const entityAccessMap: Record<SearchEntityType, { moduleKey: ModuleDefinition['key']; resource: string; action: string; internalOnly?: boolean }> = {
  customer: { moduleKey: 'customers', resource: 'customer', action: 'read', internalOnly: true },
  application: { moduleKey: 'applications', resource: 'application', action: 'read', internalOnly: true },
  loan: { moduleKey: 'loans', resource: 'loan', action: 'read', internalOnly: true },
  document: { moduleKey: 'documents', resource: 'document', action: 'read' },
  invoice: { moduleKey: 'finance', resource: 'finance', action: 'read', internalOnly: true },
  support_ticket: { moduleKey: 'support', resource: 'support_ticket', action: 'read' },
  task: { moduleKey: 'dashboard', resource: 'dashboard', action: 'read' },
  knowledge: { moduleKey: 'knowledge', resource: 'knowledge', action: 'read' },
  workflow: { moduleKey: 'dashboard', resource: 'dashboard', action: 'read', internalOnly: true },
  case: { moduleKey: 'applications', resource: 'application', action: 'read', internalOnly: true },
};

export function getSearchEntityAccess(entityType: SearchEntityType) {
  return entityAccessMap[entityType];
}

export function canAccessSearchEntity(context: BffRequestContext, entityType: SearchEntityType) {
  const access = entityAccessMap[entityType];
  if (!access) return false;
  if (access.internalOnly && !context.internalUser) return false;
  if (!context.session.enabledModules.includes(access.moduleKey)) return false;
  return canPermission(context.session.effectivePermissions, access.resource, access.action);
}

export function listAccessibleSearchEntityTypes(context: BffRequestContext): SearchEntityType[] {
  return (Object.keys(entityAccessMap) as SearchEntityType[]).filter((entityType) => canAccessSearchEntity(context, entityType));
}
