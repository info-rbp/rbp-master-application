import type { SubFeatureDefinition } from './types';

export const SUB_FEATURES: SubFeatureDefinition[] = [
  { key: 'customers.customer360', moduleKey: 'customers', name: 'Customer 360', description: 'Consolidated customer intelligence panel.', requiredCapabilities: ['customers.customer360.view'], requiredFeatureFlags: [], internalOnly: true, adminOnly: false, tags: ['customers'] },
  { key: 'customers.internal_notes', moduleKey: 'customers', name: 'Internal notes', description: 'Internal notes panel for staff.', requiredCapabilities: ['customers.notes.internal_view'], requiredFeatureFlags: [], internalOnly: true, adminOnly: false, tags: ['customers', 'internal'] },
  { key: 'finance.exports', moduleKey: 'finance', name: 'Finance exports', description: 'Invoice/export controls.', requiredCapabilities: ['finance.invoices.export'], requiredFeatureFlags: [], internalOnly: true, adminOnly: false, tags: ['finance', 'export'] },
  { key: 'support.escalation', moduleKey: 'support', name: 'Support escalation', description: 'Escalate support cases.', requiredCapabilities: ['support.escalate.execute'], requiredFeatureFlags: [], internalOnly: false, adminOnly: false, tags: ['support'] },
  { key: 'workflows.manual_review', moduleKey: 'applications', name: 'Manual review controls', description: 'Workflow review actions.', requiredCapabilities: ['workflows.review.approve'], requiredFeatureFlags: [], internalOnly: true, adminOnly: false, tags: ['workflow'] },
  { key: 'admin.rollout_preview', moduleKey: 'admin', name: 'Rollout preview', description: 'Feature preview and simulation.', requiredCapabilities: ['admin.rollout.preview'], requiredFeatureFlags: [], internalOnly: true, adminOnly: true, tags: ['admin'] },
  { key: 'admin.audit_history', moduleKey: 'admin', name: 'Audit history panel', description: 'Recent changes and audit-backed operator context.', requiredCapabilities: ['admin.audit.view'], requiredFeatureFlags: [], internalOnly: true, adminOnly: true, tags: ['admin', 'audit'] },
  { key: 'admin.membership_notes', moduleKey: 'admin', name: 'Membership notes', description: 'Admin notes and override tools for membership operations.', requiredCapabilities: ['admin.membership.notes.manage'], requiredFeatureFlags: [], internalOnly: true, adminOnly: true, tags: ['admin', 'membership'] },
];

export function getSubFeature(key: string) { return SUB_FEATURES.find((item) => item.key === key) ?? null; }
