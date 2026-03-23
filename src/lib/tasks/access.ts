import type { ModuleDefinition } from '@/lib/platform/types';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { evaluateActionPolicyAccess, toAccessContext } from '@/lib/access/evaluators';

const modulePermissions: Record<ModuleDefinition['key'], { actionPolicyKey: string; internalOnly?: boolean }> = {
  dashboard: { actionPolicyKey: 'tasks.list' },
  customers: { actionPolicyKey: 'search.query.customers', internalOnly: true },
  applications: { actionPolicyKey: 'search.query.applications', internalOnly: true },
  loans: { actionPolicyKey: 'search.query.loans', internalOnly: true },
  documents: { actionPolicyKey: 'search.query.documents' },
  finance: { actionPolicyKey: 'search.query.finance', internalOnly: true },
  support: { actionPolicyKey: 'search.query.support' },
  analytics: { actionPolicyKey: 'tasks.list' },
  knowledge: { actionPolicyKey: 'tasks.list' },
  settings: { actionPolicyKey: 'tasks.list' },
  admin: { actionPolicyKey: 'admin.audit.view', internalOnly: true },
};

export function canAccessTaskModule(context: BffRequestContext, moduleKey: ModuleDefinition['key']) {
  const rule = modulePermissions[moduleKey];
  if (!rule) return false;
  if (rule.internalOnly && !context.internalUser) return false;
  if (!context.session.enabledModules.includes(moduleKey)) return false;
  return evaluateActionPolicyAccess(rule.actionPolicyKey, toAccessContext(context)).result.allowed;
}
