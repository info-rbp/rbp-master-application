export type FeatureFlagType = 'boolean' | 'multivariate' | 'percentage' | 'structured';
export type FeatureScopeType = 'environment' | 'tenant' | 'workspace' | 'role' | 'user' | 'module';
export type ReleaseStage = 'experimental' | 'internal' | 'beta' | 'limited' | 'general_availability' | 'deprecated';

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
};
