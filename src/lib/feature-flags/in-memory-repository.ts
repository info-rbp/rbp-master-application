import type { FeatureFlagAssignment, FeatureScopeType, ModuleEnablementRule } from '@/lib/feature-flags/types';
import type { AssignmentListFilters, ControlPlaneRepository, CreateFeatureFlagAssignmentInput, CreateModuleEnablementRuleInput, ModuleRuleListFilters, UpdateFeatureFlagAssignmentInput, UpdateModuleEnablementRuleInput } from '@/lib/feature-flags/repository';

function matchesAssignment(item: FeatureFlagAssignment, filters?: AssignmentListFilters) {
  if (!filters) return true;
  if (filters.flagKey && item.flagKey !== filters.flagKey) return false;
  if (filters.scopeType && item.scopeType !== filters.scopeType) return false;
  if (filters.scopeId && item.scopeId !== filters.scopeId) return false;
  if (typeof filters.enabled === 'boolean' && item.enabled !== filters.enabled) return false;
  return true;
}

function matchesModuleRule(item: ModuleEnablementRule, filters?: ModuleRuleListFilters) {
  if (!filters) return true;
  if (filters.moduleKey && item.moduleKey !== filters.moduleKey) return false;
  if (filters.scopeType && item.scopeType !== filters.scopeType) return false;
  if (filters.scopeId && item.scopeId !== filters.scopeId) return false;
  if (typeof filters.enabled === 'boolean' && item.enabled !== filters.enabled) return false;
  return true;
}

export class InMemoryControlPlaneRepository implements ControlPlaneRepository {
  private assignments = new Map<string, FeatureFlagAssignment>();
  private moduleRules = new Map<string, ModuleEnablementRule>();

  async listAssignments(filters?: AssignmentListFilters) {
    return [...this.assignments.values()].filter((item) => matchesAssignment(item, filters));
  }

  async getAssignmentById(id: string) {
    return this.assignments.get(id) ?? null;
  }

  async createAssignment(input: CreateFeatureFlagAssignmentInput) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const record: FeatureFlagAssignment = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 };
    this.assignments.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async updateAssignment(id: string, patch: UpdateFeatureFlagAssignmentInput) {
    const existing = this.assignments.get(id);
    if (!existing) throw new Error('assignment_not_found');
    if (typeof patch.expectedVersion === 'number' && existing.version !== patch.expectedVersion) throw new Error('assignment_version_conflict');
    const next: FeatureFlagAssignment = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 };
    this.assignments.set(id, structuredClone(next));
    return structuredClone(next);
  }

  async disableAssignment(id: string, input: { updatedBy: string; expectedVersion?: number }) {
    return this.updateAssignment(id, { enabled: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion });
  }

  async listAssignmentsForFlag(flagKey: string, filters?: Omit<AssignmentListFilters, 'flagKey'>) {
    return this.listAssignments({ ...filters, flagKey });
  }

  async listAssignmentsForScope(scopeType: FeatureScopeType, scopeId: string) {
    return this.listAssignments({ scopeType, scopeId });
  }

  async listModuleRules(filters?: ModuleRuleListFilters) {
    return [...this.moduleRules.values()].filter((item) => matchesModuleRule(item, filters));
  }

  async getModuleRuleById(id: string) {
    return this.moduleRules.get(id) ?? null;
  }

  async createModuleRule(input: CreateModuleEnablementRuleInput) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const record: ModuleEnablementRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 };
    this.moduleRules.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async updateModuleRule(id: string, patch: UpdateModuleEnablementRuleInput) {
    const existing = this.moduleRules.get(id);
    if (!existing) throw new Error('module_rule_not_found');
    if (typeof patch.expectedVersion === 'number' && existing.version !== patch.expectedVersion) throw new Error('module_rule_version_conflict');
    const next: ModuleEnablementRule = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 };
    this.moduleRules.set(id, structuredClone(next));
    return structuredClone(next);
  }

  async disableModuleRule(id: string, input: { updatedBy: string; expectedVersion?: number }) {
    return this.updateModuleRule(id, { enabled: false, visible: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion });
  }

  async listRulesForModule(moduleKey: string, filters?: Omit<ModuleRuleListFilters, 'moduleKey'>) {
    return this.listModuleRules({ ...filters, moduleKey });
  }

  async listRulesForScope(scopeType: FeatureScopeType, scopeId: string) {
    return this.listModuleRules({ scopeType, scopeId });
  }

  async reset() {
    this.assignments.clear();
    this.moduleRules.clear();
  }
}

let testRepository: ControlPlaneRepository | null = null;

export function getTestControlPlaneRepository() {
  testRepository ??= new InMemoryControlPlaneRepository();
  return testRepository;
}

export function resetTestControlPlaneRepository() {
  testRepository = null;
}
