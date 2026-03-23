import type { ModuleDefinition } from '@/lib/platform/types';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { evaluateActionPolicyAccess, toAccessContext } from '@/lib/access/evaluators';
import type { SearchEntityType } from './types';

const entityAccessMap: Record<SearchEntityType, { moduleKey: ModuleDefinition['key']; actionPolicyKey: string; internalOnly?: boolean }> = {
  customer: { moduleKey: 'customers', actionPolicyKey: 'search.query.customers', internalOnly: true },
  application: { moduleKey: 'applications', actionPolicyKey: 'search.query.applications', internalOnly: true },
  loan: { moduleKey: 'loans', actionPolicyKey: 'search.query.loans', internalOnly: true },
  document: { moduleKey: 'documents', actionPolicyKey: 'search.query.documents' },
  invoice: { moduleKey: 'finance', actionPolicyKey: 'search.query.finance', internalOnly: true },
  support_ticket: { moduleKey: 'support', actionPolicyKey: 'search.query.support' },
  task: { moduleKey: 'dashboard', actionPolicyKey: 'tasks.list' },
  knowledge: { moduleKey: 'knowledge', actionPolicyKey: 'search.query.documents' },
  workflow: { moduleKey: 'dashboard', actionPolicyKey: 'search.query.workflows', internalOnly: true },
  case: { moduleKey: 'applications', actionPolicyKey: 'search.query.applications', internalOnly: true },
};

export function getSearchEntityAccess(entityType: SearchEntityType) {
  return entityAccessMap[entityType];
}

export function canAccessSearchEntity(context: BffRequestContext, entityType: SearchEntityType) {
  const access = entityAccessMap[entityType];
  if (!access) return false;
  if (access.internalOnly && !context.internalUser) return false;
  if (!context.session.enabledModules.includes(access.moduleKey)) return false;
  return evaluateActionPolicyAccess(access.actionPolicyKey, toAccessContext(context)).result.allowed;
}

export function listAccessibleSearchEntityTypes(context: BffRequestContext): SearchEntityType[] {
  return (Object.keys(entityAccessMap) as SearchEntityType[]).filter((entityType) => canAccessSearchEntity(context, entityType));
}
