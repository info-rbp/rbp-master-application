import type { FeatureFlagAssignment, FeatureScopeType, ModuleEnablementRule, PercentageRolloutRule } from '@/lib/feature-flags/types';

export type AssignmentListFilters = {
  flagKey?: string;
  scopeType?: FeatureScopeType;
  scopeId?: string;
  enabled?: boolean;
};

export type RolloutRuleListFilters = {
  flagKey?: string;
  scopeType?: FeatureScopeType;
  scopeId?: string;
  enabled?: boolean;
};

export type ModuleRuleListFilters = {
  moduleKey?: string;
  scopeType?: FeatureScopeType;
  scopeId?: string;
  enabled?: boolean;
};

export type CreateFeatureFlagAssignmentInput = Omit<FeatureFlagAssignment, 'createdAt' | 'updatedAt' | 'version'> & { createdAt?: string; updatedAt?: string; version?: number; };
export type UpdateFeatureFlagAssignmentInput = Partial<Omit<FeatureFlagAssignment, 'id' | 'createdAt' | 'createdBy'>> & { expectedVersion?: number; };
export type CreatePercentageRolloutRuleInput = Omit<PercentageRolloutRule, 'createdAt' | 'updatedAt' | 'version'> & { createdAt?: string; updatedAt?: string; version?: number; };
export type UpdatePercentageRolloutRuleInput = Partial<Omit<PercentageRolloutRule, 'id' | 'createdAt' | 'createdBy'>> & { expectedVersion?: number; };
export type CreateModuleEnablementRuleInput = Omit<ModuleEnablementRule, 'createdAt' | 'updatedAt' | 'version'> & { createdAt?: string; updatedAt?: string; version?: number; };
export type UpdateModuleEnablementRuleInput = Partial<Omit<ModuleEnablementRule, 'id' | 'createdAt' | 'createdBy'>> & { expectedVersion?: number; };

export interface FeatureFlagAssignmentRepository {
  listAssignments(filters?: AssignmentListFilters): Promise<FeatureFlagAssignment[]>;
  getAssignmentById(id: string): Promise<FeatureFlagAssignment | null>;
  createAssignment(input: CreateFeatureFlagAssignmentInput): Promise<FeatureFlagAssignment>;
  updateAssignment(id: string, patch: UpdateFeatureFlagAssignmentInput): Promise<FeatureFlagAssignment>;
  disableAssignment(id: string, input: { updatedBy: string; expectedVersion?: number }): Promise<FeatureFlagAssignment>;
  listAssignmentsForFlag(flagKey: string, filters?: Omit<AssignmentListFilters, 'flagKey'>): Promise<FeatureFlagAssignment[]>;
  listAssignmentsForScope(scopeType: FeatureScopeType, scopeId: string): Promise<FeatureFlagAssignment[]>;
}

export interface PercentageRolloutRuleRepository {
  listRolloutRules(filters?: RolloutRuleListFilters): Promise<PercentageRolloutRule[]>;
  getRolloutRuleById(id: string): Promise<PercentageRolloutRule | null>;
  createRolloutRule(input: CreatePercentageRolloutRuleInput): Promise<PercentageRolloutRule>;
  updateRolloutRule(id: string, patch: UpdatePercentageRolloutRuleInput): Promise<PercentageRolloutRule>;
  disableRolloutRule(id: string, input: { updatedBy: string; expectedVersion?: number }): Promise<PercentageRolloutRule>;
  listRolloutRulesForFlag(flagKey: string, filters?: Omit<RolloutRuleListFilters, 'flagKey'>): Promise<PercentageRolloutRule[]>;
}

export interface ModuleEnablementRuleRepository {
  listModuleRules(filters?: ModuleRuleListFilters): Promise<ModuleEnablementRule[]>;
  getModuleRuleById(id: string): Promise<ModuleEnablementRule | null>;
  createModuleRule(input: CreateModuleEnablementRuleInput): Promise<ModuleEnablementRule>;
  updateModuleRule(id: string, patch: UpdateModuleEnablementRuleInput): Promise<ModuleEnablementRule>;
  disableModuleRule(id: string, input: { updatedBy: string; expectedVersion?: number }): Promise<ModuleEnablementRule>;
  listRulesForModule(moduleKey: string, filters?: Omit<ModuleRuleListFilters, 'moduleKey'>): Promise<ModuleEnablementRule[]>;
  listRulesForScope(scopeType: FeatureScopeType, scopeId: string): Promise<ModuleEnablementRule[]>;
}

export interface ControlPlaneRepository extends FeatureFlagAssignmentRepository, PercentageRolloutRuleRepository, ModuleEnablementRuleRepository {
  reset?(): Promise<void>;
}
