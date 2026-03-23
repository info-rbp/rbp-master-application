import type { FeatureCatalogEntry, FeatureEvaluationResult, FeatureFlagAssignment, ModuleAccessControlResult, ModuleEnablementRule } from '@/lib/feature-flags/types';

export type FeatureFlagDefinitionDto = FeatureCatalogEntry;
export type FeatureFlagAssignmentDto = FeatureFlagAssignment;
export type FeatureEvaluationResultDto = FeatureEvaluationResult;
export type FeatureCatalogDto = { items: FeatureCatalogEntry[] };
export type FeaturePreviewRequestDto = { tenantId: string; workspaceId?: string; userId?: string; roleCodes?: string[]; currentModule?: string; currentRoute?: string; dryRunAssignment?: Partial<FeatureFlagAssignment>; dryRunModuleRule?: Partial<ModuleEnablementRule> };
export type FeaturePreviewResponseDto = { flags: Record<string, boolean>; evaluations: FeatureEvaluationResult[]; modules: ModuleAccessControlResult[] };
export type ModuleEnablementRuleDto = ModuleEnablementRule;
export type ModuleAccessControlResultDto = ModuleAccessControlResult;
export type ModuleControlCatalogDto = { items: ModuleEnablementRule[] };
export type CreateFeatureAssignmentDto = Pick<FeatureFlagAssignment, 'flagKey' | 'scopeType' | 'scopeId' | 'value' | 'reason' | 'releaseStage' | 'startsAt' | 'endsAt' | 'enabled' | 'metadata'>;
export type UpdateFeatureAssignmentDto = Partial<CreateFeatureAssignmentDto>;
export type CreateModuleControlDto = Pick<ModuleEnablementRule, 'moduleKey' | 'scopeType' | 'scopeId' | 'enabled' | 'visible' | 'internalOnly' | 'betaOnly' | 'defaultLanding' | 'startsAt' | 'endsAt' | 'reason' | 'metadata'>;
export type UpdateModuleControlDto = Partial<CreateModuleControlDto>;
export type EffectiveFeatureFlagsDto = Record<string, boolean>;
export type EffectiveModuleControlsDto = string[];
