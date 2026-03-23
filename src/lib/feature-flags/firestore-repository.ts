import '@/lib/server-only';

import { firestore } from '@/firebase/server';
import type { FeatureFlagAssignment, FeatureScopeType, ModuleEnablementRule, PercentageRolloutRule } from '@/lib/feature-flags/types';
import type { AssignmentListFilters, ControlPlaneRepository, CreateFeatureFlagAssignmentInput, CreateModuleEnablementRuleInput, CreatePercentageRolloutRuleInput, ModuleRuleListFilters, RolloutRuleListFilters, UpdateFeatureFlagAssignmentInput, UpdateModuleEnablementRuleInput, UpdatePercentageRolloutRuleInput } from '@/lib/feature-flags/repository';

const ROOT_COLLECTION = process.env.RBP_CONTROL_PLANE_COLLECTION ?? 'platform_control_plane';
const ASSIGNMENT_COLLECTION = 'feature_flag_assignments';
const ROLLOUT_COLLECTION = 'percentage_rollout_rules';
const MODULE_RULE_COLLECTION = 'module_enablement_rules';

const runtimeDoc = () => firestore.collection(ROOT_COLLECTION).doc('runtime');
const assignmentsCollection = () => runtimeDoc().collection(ASSIGNMENT_COLLECTION);
const rolloutRulesCollection = () => runtimeDoc().collection(ROLLOUT_COLLECTION);
const moduleRulesCollection = () => runtimeDoc().collection(MODULE_RULE_COLLECTION);

function applyFilters(query: FirebaseFirestore.Query, filters?: Record<string, unknown>) { let next = query; for (const [key, value] of Object.entries(filters ?? {})) if (typeof value !== 'undefined') next = next.where(key, '==', value); return next; }
async function listDocs<T>(query: FirebaseFirestore.Query) { const snapshot = await query.get(); return snapshot.docs.map((doc) => doc.data() as T); }

async function updateVersioned<T extends { id: string; createdAt: string; createdBy: string; version: number }>(ref: FirebaseFirestore.DocumentReference, patch: Record<string, unknown>, missing: string, conflict: string) {
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error(missing);
    const existing = snapshot.data() as T;
    if (typeof patch.expectedVersion === 'number' && existing.version !== patch.expectedVersion) throw new Error(conflict);
    const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 } as T;
    transaction.set(ref, next);
    return next;
  });
}

export class FirestoreControlPlaneRepository implements ControlPlaneRepository {
  async listAssignments(filters?: AssignmentListFilters) { return listDocs<FeatureFlagAssignment>(applyFilters(assignmentsCollection(), filters as any)); }
  async getAssignmentById(id: string) { const s = await assignmentsCollection().doc(id).get(); return s.exists ? s.data() as FeatureFlagAssignment : null; }
  async createAssignment(input: CreateFeatureFlagAssignmentInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: FeatureFlagAssignment = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; await assignmentsCollection().doc(record.id).set(record); return record; }
  async updateAssignment(id: string, patch: UpdateFeatureFlagAssignmentInput) { return updateVersioned<FeatureFlagAssignment>(assignmentsCollection().doc(id), patch as any, 'assignment_not_found', 'assignment_version_conflict'); }
  async disableAssignment(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateAssignment(id, { enabled: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listAssignmentsForFlag(flagKey: string, filters?: Omit<AssignmentListFilters, 'flagKey'>) { return this.listAssignments({ ...filters, flagKey }); }
  async listAssignmentsForScope(scopeType: FeatureScopeType, scopeId: string) { return this.listAssignments({ scopeType, scopeId }); }

  async listRolloutRules(filters?: RolloutRuleListFilters) { return listDocs<PercentageRolloutRule>(applyFilters(rolloutRulesCollection(), filters as any)); }
  async getRolloutRuleById(id: string) { const s = await rolloutRulesCollection().doc(id).get(); return s.exists ? s.data() as PercentageRolloutRule : null; }
  async createRolloutRule(input: CreatePercentageRolloutRuleInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: PercentageRolloutRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; await rolloutRulesCollection().doc(record.id).set(record); return record; }
  async updateRolloutRule(id: string, patch: UpdatePercentageRolloutRuleInput) { return updateVersioned<PercentageRolloutRule>(rolloutRulesCollection().doc(id), patch as any, 'rollout_rule_not_found', 'rollout_rule_version_conflict'); }
  async disableRolloutRule(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateRolloutRule(id, { enabled: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listRolloutRulesForFlag(flagKey: string, filters?: Omit<RolloutRuleListFilters, 'flagKey'>) { return this.listRolloutRules({ ...filters, flagKey }); }

  async listModuleRules(filters?: ModuleRuleListFilters) { return listDocs<ModuleEnablementRule>(applyFilters(moduleRulesCollection(), filters as any)); }
  async getModuleRuleById(id: string) { const s = await moduleRulesCollection().doc(id).get(); return s.exists ? s.data() as ModuleEnablementRule : null; }
  async createModuleRule(input: CreateModuleEnablementRuleInput) { const createdAt = input.createdAt ?? new Date().toISOString(); const record: ModuleEnablementRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 }; await moduleRulesCollection().doc(record.id).set(record); return record; }
  async updateModuleRule(id: string, patch: UpdateModuleEnablementRuleInput) { return updateVersioned<ModuleEnablementRule>(moduleRulesCollection().doc(id), patch as any, 'module_rule_not_found', 'module_rule_version_conflict'); }
  async disableModuleRule(id: string, input: { updatedBy: string; expectedVersion?: number }) { return this.updateModuleRule(id, { enabled: false, visible: false, updatedBy: input.updatedBy, expectedVersion: input.expectedVersion }); }
  async listRulesForModule(moduleKey: string, filters?: Omit<ModuleRuleListFilters, 'moduleKey'>) { return this.listModuleRules({ ...filters, moduleKey }); }
  async listRulesForScope(scopeType: FeatureScopeType, scopeId: string) { return this.listModuleRules({ scopeType, scopeId }); }
}
