import { ACTION_POLICIES } from './action-policies';
import { listCapabilityFamilies } from './capabilities';
import { ROUTE_POLICIES } from './route-policies';
import { SUB_FEATURES } from './sub-features';
import { listModuleDefinitions } from '@/lib/platform/bootstrap';

const REQUIRED_ROUTE_PATTERNS = [
  '/admin',
  '/api/admin',
  '/admin/system',
  '/admin/users',
  '/admin/membership',
  '/admin/knowledge-center',
  '/admin/system/feature-controls',
  '/api/admin/knowledge-center',
  '/api/admin/membership/members',
  '/api/admin/feature-flags',
  '/api/admin/module-controls',
  '/api/admin/feature-preview',
  '/api/search',
  '/api/tasks',
  '/api/tasks/summary',
  '/api/workflows/application-submission',
  '/api/workflows/review-approval/start',
  '/api/workflows/support-escalation',
  '/api/workflows/document-upload',
  '/api/workflows/billing-event',
  '/api/audit',
  '/settings',
] as const;

const REQUIRED_ACTION_KEYS = [
  'admin.console.view',
  'admin.feature_assignment.create',
  'admin.rollout_rule.create',
  'admin.module_rule.create',
  'admin.rollout.preview',
  'admin.audit.view',
  'admin.knowledge.read',
  'admin.knowledge.manage',
  'admin.membership.read',
  'admin.membership.manage',
  'admin.membership.notes.manage',
  'admin.membership.override.manage',
  'search.query',
  'search.query.finance',
  'tasks.list',
  'tasks.assign',
  'tasks.complete',
  'tasks.escalate',
  'workflows.review.start',
  'workflows.review.approve',
  'workflows.review.reject',
  'workflows.review.request_more_info',
  'documents.upload',
  'support.escalate',
] as const;

const REQUIRED_SUB_FEATURE_KEYS = [
  'admin.rollout_preview',
  'admin.audit_history',
  'admin.membership_notes',
  'customers.internal_notes',
  'support.escalation',
  'workflows.manual_review',
] as const;

export function validateAccessDefinitions() {
  const capabilities = new Set(Object.keys(listCapabilityFamilies()));
  const modules = new Set(listModuleDefinitions().map((module) => module.key));
  const errors: string[] = [];

  const validateRef = (owner: string, capabilityList: string[], moduleKey?: string) => {
    for (const capability of capabilityList) {
      if (!capabilities.has(capability)) errors.push(`${owner} references unknown capability ${capability}`);
    }
    if (moduleKey && !modules.has(moduleKey)) errors.push(`${owner} references unknown module ${moduleKey}`);
  };

  for (const policy of ROUTE_POLICIES) validateRef(`route:${policy.id}`, policy.requiredCapabilities, policy.moduleKey);
  for (const policy of ACTION_POLICIES) validateRef(`action:${policy.id}`, policy.requiredCapabilities, policy.moduleKey);
  for (const feature of SUB_FEATURES) validateRef(`subfeature:${feature.key}`, feature.requiredCapabilities, feature.moduleKey);

  const routeIds = new Set<string>();
  for (const policy of ROUTE_POLICIES) {
    if (routeIds.has(policy.id)) errors.push(`duplicate route policy id ${policy.id}`);
    routeIds.add(policy.id);
  }

  const actionKeys = new Set<string>();
  for (const policy of ACTION_POLICIES) {
    if (actionKeys.has(policy.actionKey)) errors.push(`duplicate action policy key ${policy.actionKey}`);
    actionKeys.add(policy.actionKey);
  }

  const routePatterns = new Set(ROUTE_POLICIES.map((policy) => policy.pathPattern));
  for (const pathPattern of REQUIRED_ROUTE_PATTERNS) {
    if (!routePatterns.has(pathPattern)) errors.push(`missing required route policy for ${pathPattern}`);
  }

  for (const actionKey of REQUIRED_ACTION_KEYS) {
    if (!actionKeys.has(actionKey)) errors.push(`missing required action policy ${actionKey}`);
  }

  const subFeatureKeys = new Set(SUB_FEATURES.map((feature) => feature.key));
  for (const subFeatureKey of REQUIRED_SUB_FEATURE_KEYS) {
    if (!subFeatureKeys.has(subFeatureKey)) errors.push(`missing required subfeature ${subFeatureKey}`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertAccessDefinitions() {
  const result = validateAccessDefinitions();
  if (!result.valid) throw new Error(`invalid_access_definitions:${result.errors.join('; ')}`);
  return result;
}
