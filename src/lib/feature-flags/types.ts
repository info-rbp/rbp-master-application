export type FeatureFlagType = 'boolean' | 'multivariate' | 'percentage' | 'structured';
export type FeatureScopeType = 'environment' | 'tenant' | 'workspace' | 'role' | 'user' | 'module';
export type ReleaseStage = 'experimental' | 'internal' | 'beta' | 'limited' | 'general_availability' | 'deprecated';
export type RolloutBucketBy = 'tenant' | 'workspace' | 'role' | 'user' | 'composite';

export type FeatureFlagDefinition = {
  key: string;
  name: string;
  description: string;
  category: 'module_rollout' | 'navigation' | 'dashboard' | 'customers' | 'applications' | 'loans' | 'documents' | 'finance' | 'support' | 'analytics' | 'settings' | 'admin' | 'workflows' | 'notifications' | 'search' | 'tasks' | 'integrations' | 'security' | 'experimental';
  flagType: FeatureFlagType;
  defaultValue: boolean | string | number | Record<string, unknown>;
  allowedScopes: FeatureScopeType[];
  releaseStage: ReleaseStage;
  isKillSwitch: boolean;
  isInternalOnly: boolean;
  isDeprecated: boolean;
  dependencies: string[];
  conflicts: string[];
  tags: string[];
  owner?: string;
  createdBySystem: boolean;
};

export type FeatureFlagAssignment = {
  id: string;
  flagKey: string;
  scopeType: FeatureScopeType;
  scopeId: string;
  value: boolean | string | number | Record<string, unknown>;
  reason: string;
  releaseStage?: ReleaseStage;
  startsAt?: string;
  endsAt?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  metadata: Record<string, unknown>;
  version: number;
};

export type PercentageRolloutRule = {
  id: string;
  flagKey: string;
  scopeType: FeatureScopeType;
  scopeId: string;
  percentage: number;
  bucketBy: RolloutBucketBy;
  salt?: string;
  startsAt?: string;
  endsAt?: string;
  enabled: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  metadata: Record<string, unknown>;
  version: number;
};

export type ModuleEnablementRule = {
  id: string;
  moduleKey: string;
  scopeType: Exclude<FeatureScopeType, 'user' | 'role'> | 'role';
  scopeId: string;
  enabled: boolean;
  visible: boolean;
  internalOnly: boolean;
  betaOnly: boolean;
  defaultLanding?: string;
  startsAt?: string;
  endsAt?: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  metadata: Record<string, unknown>;
  version: number;
};

export type FeatureEvaluationReason = {
  code: string;
  category: 'precedence' | 'dependency' | 'conflict' | 'release_stage' | 'kill_switch' | 'rollout' | 'targeting' | 'validation';
  message: string;
  source: string;
  scopeType?: FeatureScopeType;
  scopeId?: string;
  details?: Record<string, unknown>;
};

export type RolloutTargetIdentity = {
  targetType: 'tenant' | 'workspace' | 'role' | 'user' | 'composite';
  targetId: string;
  tenantId?: string;
  workspaceId?: string;
  roleCodes?: string[];
  userId?: string;
  normalizedKey: string;
};

export type BucketEvaluationResult = {
  algorithm: string;
  normalizedKey: string;
  hashValue: number;
  bucket: number;
  threshold: number;
  matched: boolean;
  saltUsed?: string;
};

export type FeatureEvaluationContext = {
  environment: string;
  tenantId: string;
  workspaceId?: string;
  userId?: string;
  roleCodes: string[];
  enabledModules: string[];
  currentModule?: string;
  currentRoute?: string;
  isInternalUser: boolean;
  correlationId: string;
};

export type PreviewEvaluationContext = FeatureEvaluationContext & {
  featureKeys?: string[];
  includeReasoning: boolean;
  includeBucketDetails: boolean;
};

export type FeatureEvaluationResult = {
  flagKey: string;
  exists: boolean;
  enabled: boolean;
  value: unknown;
  source: string;
  scopeType: FeatureScopeType | 'definition';
  scopeId?: string;
  releaseStage: ReleaseStage;
  isKillSwitch: boolean;
  reasonCodes: string[];
  reasons: FeatureEvaluationReason[];
  bucketResult?: BucketEvaluationResult;
  dependenciesSatisfied: boolean;
  conflictsDetected: string[];
};

export type ModuleAccessControlResult = {
  moduleKey: string;
  exists: boolean;
  enabled: boolean;
  visible: boolean;
  source: string;
  internalOnly: boolean;
  betaOnly: boolean;
  reasonCodes: string[];
  dependsOnFlags: string[];
  dependsOnModules: string[];
  releaseStage?: ReleaseStage;
  defaultLanding?: string;
};

export type FeatureCatalogEntry = {
  flagKey: string;
  name: string;
  description: string;
  category: FeatureFlagDefinition['category'];
  releaseStage: ReleaseStage;
  currentDefaultValue: unknown;
  scopesSupported: FeatureScopeType[];
  isKillSwitch: boolean;
  isDeprecated: boolean;
  owner?: string;
  tags: string[];
  dependencies: string[];
  conflicts: string[];
  supportsPercentageRollout: boolean;
};

export type PreviewEvaluationResult = {
  contextSummary: Record<string, unknown>;
  evaluatedFlags: FeatureEvaluationResult[];
  evaluatedModules: ModuleAccessControlResult[];
  warnings: string[];
  conflicts: string[];
  missingDependencies: string[];
  meta: Record<string, unknown>;
};

export type ControlPlaneIssueSeverity = 'info' | 'warning' | 'critical';
export type ControlPlaneIssueType =
  | 'conflicting_assignment'
  | 'conflicting_rollout'
  | 'expired_rule'
  | 'scheduled_rule'
  | 'disabled_override'
  | 'dependency_blocked'
  | 'conflict_blocked'
  | 'deprecated_override'
  | 'kill_switch_active'
  | 'module_inconsistent_state';

export type ControlPlaneIssue = {
  id: string;
  area: 'feature_flag' | 'module_control' | 'control_plane';
  targetKey: string;
  severity: ControlPlaneIssueSeverity;
  type: ControlPlaneIssueType;
  summary: string;
  detail: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  relatedIds: string[];
};

export type FeatureFlagOperationalSummary = FeatureCatalogEntry & {
  effectiveEnabled: boolean;
  effectiveValue: unknown;
  winningSource: string;
  winningScope: string;
  hasOverrides: boolean;
  hasConflicts: boolean;
  hasActiveRollout: boolean;
  hasScheduledChanges: boolean;
  diagnostics: ControlPlaneIssueType[];
  activeAssignmentCount: number;
  activeRolloutCount: number;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  currentReasonCodes: string[];
  activeKillSwitch: boolean;
};

export type ModuleControlOperationalSummary = {
  moduleKey: string;
  moduleName: string;
  description: string;
  category: string;
  route: string;
  effectiveEnabled: boolean;
  effectiveVisible: boolean;
  winningSource: string;
  winningRuleId?: string;
  hasOverrides: boolean;
  diagnostics: ControlPlaneIssueType[];
  activeRuleCount: number;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  internalOnly: boolean;
  betaOnly: boolean;
  defaultLanding?: string;
  reasonCodes: string[];
};
