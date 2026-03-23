import type { FeatureFlagAssignment, FeatureScopeType, ModuleEnablementRule, PercentageRolloutRule } from '@/lib/feature-flags/types';
import type { AssignmentListFilters, ControlPlaneRepository, CreateFeatureFlagAssignmentInput, CreateModuleEnablementRuleInput, CreatePercentageRolloutRuleInput, ModuleRuleListFilters, RolloutRuleListFilters, UpdateFeatureFlagAssignmentInput, UpdateModuleEnablementRuleInput, UpdatePercentageRolloutRuleInput } from '@/lib/feature-flags/repository';

function matches(item: Record<string, unknown>, filters?: Record<string, unknown>) {
  if (!filters) return true;
  return Object.entries(filters).every(([key, value]) => typeof value === 'undefined' || item[key] === value);
}

export class InMemoryControlPlaneRepository implements ControlPlaneRepository {
  private assignments = new Map<string, FeatureFlagAssignment>();
  private rolloutRules = new Map<string, PercentageRolloutRule>();
  private moduleRules = new Map<string, ModuleEnablementRule>();

  async listAssignments(filters?: AssignmentListFilters) { return [...this.assignments.values()].filter((item) => matches(item as any, filters as any)); }
  async getAssignmentById(id: string) { return this.assignments.get(id) ?? null; }
  async createAssignment(input: CreateFeatureFlagAssignmentInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: FeatureFlagAssignment = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; this.assignments.set(record.id, structuredClone(record)); return structuredClone(record); }
  async updateAssignment(id: string, patch: UpdateFeatureFlagAssignmentInput) { const existing = this.assignments.get(id); if (!existing) throw new Error('assignment_not_found'); if (typeof patch.expectedVersion === 'number' && patch.expectedVersion !== existing.version) throw new Error('assignment_version_conflict'); const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 }; this.assignments.set(id, structuredClone(next)); return structuredClone(next); }
  async disableAssignment(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateAssignment(id, { enabled: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listAssignmentsForFlag(flagKey: string, filters?: Omit<AssignmentListFilters, 'flagKey'>) { return this.listAssignments({ ...filters, flagKey }); }
  async listAssignmentsForScope(scopeType: FeatureScopeType, scopeId: string) { return this.listAssignments({ scopeType, scopeId }); }

  async listRolloutRules(filters?: RolloutRuleListFilters) { return [...this.rolloutRules.values()].filter((item) => matches(item as any, filters as any)); }
  async getRolloutRuleById(id: string) { return this.rolloutRules.get(id) ?? null; }
  async createRolloutRule(input: CreatePercentageRolloutRuleInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: PercentageRolloutRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; this.rolloutRules.set(record.id, structuredClone(record)); return structuredClone(record); }
  async updateRolloutRule(id: string, patch: UpdatePercentageRolloutRuleInput) { const existing = this.rolloutRules.get(id); if (!existing) throw new Error('rollout_rule_not_found'); if (typeof patch.expectedVersion === 'number' && patch.expectedVersion !== existing.version) throw new Error('rollout_rule_version_conflict'); const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 }; this.rolloutRules.set(id, structuredClone(next)); return structuredClone(next); }
  async disableRolloutRule(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateRolloutRule(id, { enabled: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listRolloutRulesForFlag(flagKey: string, filters?: Omit<RolloutRuleListFilters, 'flagKey'>) { return this.listRolloutRules({ ...filters, flagKey }); }

  async listModuleRules(filters?: ModuleRuleListFilters) { return [...this.moduleRules.values()].filter((item) => matches(item as any, filters as any)); }
  async getModuleRuleById(id: string) { return this.moduleRules.get(id) ?? null; }
  async createModuleRule(input: CreateModuleEnablementRuleInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: ModuleEnablementRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; this.moduleRules.set(record.id, structuredClone(record)); return structuredClone(record); }
  async updateModuleRule(id: string, patch: UpdateModuleEnablementRuleInput) { const existing = this.moduleRules.get(id); if (!existing) throw new Error('module_rule_not_found'); if (typeof patch.expectedVersion === 'number' && patch.expectedVersion !== existing.version) throw new Error('module_rule_version_conflict'); const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 }; this.moduleRules.set(id, structuredClone(next)); return structuredClone(next); }
  async disableModuleRule(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateModuleRule(id, { enabled: false, visible: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listRulesForModule(moduleKey: string, filters?: Omit<ModuleRuleListFilters, 'moduleKey'>) { return this.listModuleRules({ ...filters, moduleKey }); }
  async listRulesForScope(scopeType: FeatureScopeType, scopeId: string) { return this.listModuleRules({ scopeType, scopeId }); }

  async reset() { this.assignments.clear(); this.rolloutRules.clear(); this.moduleRules.clear(); }
}

let testRepository: ControlPlaneRepository | null = null;
export function getTestControlPlaneRepository() { testRepository ??= new InMemoryControlPlaneRepository(); return testRepository; }
export function resetTestControlPlaneRepository() { testRepository = null; }
