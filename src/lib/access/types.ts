import type { FeatureScopeType } from '@/lib/feature-flags/types';
import type { ModuleDefinition, PermissionGrant } from '@/lib/platform/types';

export type CapabilityKey =
  | 'dashboard.view'
  | 'customers.list.view'
  | 'customers.detail.view'
  | 'customers.customer360.view'
  | 'customers.notes.internal_view'
  | 'applications.list.view'
  | 'applications.detail.view'
  | 'applications.submit.execute'
  | 'loans.detail.view'
  | 'loans.variations.request'
  | 'documents.list.view'
  | 'documents.upload.execute'
  | 'documents.review.approve'
  | 'finance.invoices.view'
  | 'finance.invoices.export'
  | 'support.tickets.view'
  | 'support.escalate.execute'
  | 'analytics.view'
  | 'knowledge.view'
  | 'workflows.review.start'
  | 'workflows.review.approve'
  | 'workflows.review.reject'
  | 'workflows.review.request_more_info'
  | 'workflows.status.view'
  | 'tasks.view'
  | 'tasks.assign.execute'
  | 'tasks.complete.execute'
  | 'search.customers.query'
  | 'search.applications.query'
  | 'search.loans.query'
  | 'search.documents.query'
  | 'search.finance.query'
  | 'search.support.query'
  | 'search.workflows.query'
  | 'admin.console.view'
  | 'admin.feature_flags.read'
  | 'admin.feature_flags.manage'
  | 'admin.module_controls.read'
  | 'admin.module_controls.manage'
  | 'admin.rollout.preview'
  | 'admin.audit.view'
  | 'admin.kill_switch.manage'
  | 'admin.knowledge.view'
  | 'admin.knowledge.manage'
  | 'admin.membership.view'
  | 'admin.membership.manage'
  | 'admin.membership.notes.manage'
  | 'admin.membership.override.manage'
  | 'settings.profile.view'
  | 'settings.team.manage';

export type AccessEvaluationContext = {
  environment: string;
  tenantId: string;
  workspaceId?: string;
  userId?: string;
  roleCodes: string[];
  enabledModules: string[];
  effectiveFlags: Record<string, boolean>;
  effectivePermissions: PermissionGrant[];
  internalUser: boolean;
  activeRoute?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  correlationId: string;
};

export type AccessEvaluationResult = {
  allowed: boolean;
  source: string;
  requiredCapabilities: CapabilityKey[];
  missingCapabilities: CapabilityKey[];
  requiredFlags: string[];
  missingFlags: string[];
  requiredModules: string[];
  missingModules: string[];
  reasonCodes: string[];
  conditionsPassed: boolean;
  degraded?: boolean;
  visibilitySuggestion?: 'visible' | 'hidden' | 'disabled' | 'admin_only' | 'internal_only';
};

export type RoutePolicyDefinition = {
  id: string;
  pathPattern: string;
  routeKind: 'public_page' | 'protected_page' | 'api_endpoint' | 'admin_page' | 'workflow_endpoint' | 'task_endpoint' | 'internal_endpoint';
  moduleKey?: ModuleDefinition['key'];
  requiredCapabilities: CapabilityKey[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requiredFeatureFlags: string[];
  requiredModuleControls: string[];
  requiredReleaseStage?: string;
  tenantScoped: boolean;
  workspaceScoped: boolean;
  internalOnly: boolean;
  adminOnly: boolean;
  hideFromNav: boolean;
  accessDeniedBehavior: 'redirect_login' | 'redirect_default' | 'render_access_denied' | 'not_found' | 'disabled_unavailable';
  conditions?: string[];
  tags?: string[];
};

export type ActionPolicyDefinition = {
  id: string;
  actionKey: string;
  category: string;
  moduleKey?: ModuleDefinition['key'];
  requiredCapabilities: CapabilityKey[];
  requiredFeatureFlags: string[];
  requiredModuleControls: string[];
  tenantScoped: boolean;
  workspaceScoped: boolean;
  internalOnly: boolean;
  entityType?: string;
  conditions?: string[];
  highRisk: boolean;
  auditOnAttempt: boolean;
  auditOnDeny: boolean;
};

export type SubFeatureDefinition = {
  key: string;
  moduleKey: ModuleDefinition['key'];
  name: string;
  description: string;
  requiredCapabilities: CapabilityKey[];
  requiredFeatureFlags: string[];
  internalOnly: boolean;
  adminOnly: boolean;
  tags: string[];
};
