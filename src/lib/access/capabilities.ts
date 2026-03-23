import { canPermission } from '@/lib/platform/permissions';
import type { AccessEvaluationContext, CapabilityKey } from './types';

const capabilityRequirements: Record<CapabilityKey, { moduleKey?: string; featureFlags?: string[]; internalOnly?: boolean; permissions?: Array<{ resource: string; action: string }> }> = {
  'dashboard.view': { moduleKey: 'dashboard', permissions: [{ resource: 'dashboard', action: 'read' }] },
  'customers.list.view': { moduleKey: 'customers', internalOnly: true, permissions: [{ resource: 'customer', action: 'read' }] },
  'customers.detail.view': { moduleKey: 'customers', internalOnly: true, permissions: [{ resource: 'customer', action: 'read' }] },
  'customers.customer360.view': { moduleKey: 'customers', internalOnly: true, permissions: [{ resource: 'customer', action: 'read' }] },
  'customers.notes.internal_view': { moduleKey: 'customers', internalOnly: true, permissions: [{ resource: 'customer', action: 'update' }] },
  'applications.list.view': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'read' }] },
  'applications.detail.view': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'read' }] },
  'applications.submit.execute': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'create' }] },
  'loans.detail.view': { moduleKey: 'loans', internalOnly: true, permissions: [{ resource: 'loan', action: 'read' }] },
  'loans.variations.request': { moduleKey: 'loans', internalOnly: true, permissions: [{ resource: 'loan', action: 'update' }] },
  'documents.list.view': { moduleKey: 'documents', permissions: [{ resource: 'document', action: 'read' }] },
  'documents.upload.execute': { moduleKey: 'documents', permissions: [{ resource: 'document', action: 'create' }] },
  'documents.review.approve': { moduleKey: 'documents', internalOnly: true, permissions: [{ resource: 'document', action: 'approve' }] },
  'finance.invoices.view': { moduleKey: 'finance', internalOnly: true, permissions: [{ resource: 'finance', action: 'read' }] },
  'finance.invoices.export': { moduleKey: 'finance', internalOnly: true, permissions: [{ resource: 'finance', action: 'export' }] },
  'support.tickets.view': { moduleKey: 'support', permissions: [{ resource: 'support_ticket', action: 'read' }] },
  'support.escalate.execute': { moduleKey: 'support', permissions: [{ resource: 'support_ticket', action: 'manage' }] },
  'analytics.view': { moduleKey: 'analytics', permissions: [{ resource: 'analytics', action: 'read' }] },
  'knowledge.view': { moduleKey: 'knowledge', permissions: [{ resource: 'knowledge', action: 'read' }] },
  'workflows.review.start': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'read' }] },
  'workflows.review.approve': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'approve' }] },
  'workflows.review.reject': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'approve' }] },
  'workflows.review.request_more_info': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'update' }] },
  'workflows.status.view': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'read' }] },
  'tasks.view': { moduleKey: 'dashboard', permissions: [{ resource: 'dashboard', action: 'read' }] },
  'tasks.assign.execute': { moduleKey: 'dashboard', permissions: [{ resource: 'dashboard', action: 'manage' }] },
  'tasks.complete.execute': { moduleKey: 'dashboard', permissions: [{ resource: 'dashboard', action: 'update' }] },
  'search.customers.query': { moduleKey: 'customers', internalOnly: true, permissions: [{ resource: 'customer', action: 'read' }] },
  'search.applications.query': { moduleKey: 'applications', internalOnly: true, permissions: [{ resource: 'application', action: 'read' }] },
  'search.loans.query': { moduleKey: 'loans', internalOnly: true, permissions: [{ resource: 'loan', action: 'read' }] },
  'search.documents.query': { moduleKey: 'documents', permissions: [{ resource: 'document', action: 'read' }] },
  'search.finance.query': { moduleKey: 'finance', internalOnly: true, permissions: [{ resource: 'finance', action: 'read' }] },
  'search.support.query': { moduleKey: 'support', permissions: [{ resource: 'support_ticket', action: 'read' }] },
  'search.workflows.query': { moduleKey: 'dashboard', internalOnly: true, permissions: [{ resource: 'dashboard', action: 'read' }] },
  'admin.feature_flags.read': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'feature_flags', action: 'read' }] },
  'admin.feature_flags.manage': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'feature_flags', action: 'manage' }] },
  'admin.module_controls.read': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'module_controls', action: 'read' }] },
  'admin.module_controls.manage': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'module_controls', action: 'manage' }] },
  'admin.rollout.preview': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'rollout', action: 'preview' }] },
  'admin.audit.view': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'admin_user', action: 'read' }] },
  'admin.kill_switch.manage': { moduleKey: 'admin', internalOnly: true, permissions: [{ resource: 'kill_switch', action: 'manage' }] },
  'settings.profile.view': { moduleKey: 'settings', permissions: [{ resource: 'settings', action: 'read' }] },
  'settings.team.manage': { moduleKey: 'settings', permissions: [{ resource: 'settings', action: 'manage' }] },
};

export function hasCapability(context: AccessEvaluationContext, capability: CapabilityKey) {
  const req = capabilityRequirements[capability];
  if (!req) return false;
  if (req.internalOnly && !context.internalUser) return false;
  if (req.moduleKey && !context.enabledModules.includes(req.moduleKey)) return false;
  if (req.featureFlags?.some((flag) => !context.effectiveFlags[flag])) return false;
  if (req.permissions?.some((perm) => !canPermission(context.effectivePermissions, perm.resource, perm.action))) return false;
  return true;
}

export function listCapabilityFamilies() {
  return capabilityRequirements;
}
