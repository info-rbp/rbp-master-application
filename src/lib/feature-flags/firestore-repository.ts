import '@/lib/server-only';

import { firestore } from '@/firebase/server';
import type { FeatureFlagAssignment, FeatureScopeType, ModuleEnablementRule } from '@/lib/feature-flags/types';
import type { AssignmentListFilters, ControlPlaneRepository, CreateFeatureFlagAssignmentInput, CreateModuleEnablementRuleInput, ModuleRuleListFilters, UpdateFeatureFlagAssignmentInput, UpdateModuleEnablementRuleInput } from '@/lib/feature-flags/repository';

const ROOT_COLLECTION = process.env.RBP_CONTROL_PLANE_COLLECTION ?? 'platform_control_plane';
const ASSIGNMENT_COLLECTION = 'feature_flag_assignments';
const MODULE_RULE_COLLECTION = 'module_enablement_rules';

function assignmentsCollection() {
  return firestore.collection(ROOT_COLLECTION).doc('runtime').collection(ASSIGNMENT_COLLECTION);
}

function moduleRulesCollection() {
  return firestore.collection(ROOT_COLLECTION).doc('runtime').collection(MODULE_RULE_COLLECTION);
}

function applyAssignmentFilters(query: FirebaseFirestore.Query, filters?: AssignmentListFilters) {
  let next = query;
  if (filters?.flagKey) next = next.where('flagKey', '==', filters.flagKey);
  if (filters?.scopeType) next = next.where('scopeType', '==', filters.scopeType);
  if (filters?.scopeId) next = next.where('scopeId', '==', filters.scopeId);
  if (typeof filters?.enabled === 'boolean') next = next.where('enabled', '==', filters.enabled);
  return next;
}

function applyModuleRuleFilters(query: FirebaseFirestore.Query, filters?: ModuleRuleListFilters) {
  let next = query;
  if (filters?.moduleKey) next = next.where('moduleKey', '==', filters.moduleKey);
  if (filters?.scopeType) next = next.where('scopeType', '==', filters.scopeType);
  if (filters?.scopeId) next = next.where('scopeId', '==', filters.scopeId);
  if (typeof filters?.enabled === 'boolean') next = next.where('enabled', '==', filters.enabled);
  return next;
}

async function listDocs<T>(query: FirebaseFirestore.Query) {
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as T);
}

export class FirestoreControlPlaneRepository implements ControlPlaneRepository {
  async listAssignments(filters?: AssignmentListFilters) {
    return listDocs<FeatureFlagAssignment>(applyAssignmentFilters(assignmentsCollection(), filters));
  }

  async getAssignmentById(id: string) {
    const snapshot = await assignmentsCollection().doc(id).get();
    return snapshot.exists ? snapshot.data() as FeatureFlagAssignment : null;
  }

  async createAssignment(input: CreateFeatureFlagAssignmentInput) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const record: FeatureFlagAssignment = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 };
    await assignmentsCollection().doc(record.id).set(record);
    return record;
  }

  async updateAssignment(id: string, patch: UpdateFeatureFlagAssignmentInput) {
    const ref = assignmentsCollection().doc(id);
    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('assignment_not_found');
      const existing = snapshot.data() as FeatureFlagAssignment;
      if (typeof patch.expectedVersion === 'number' && existing.version !== patch.expectedVersion) throw new Error('assignment_version_conflict');
      const next: FeatureFlagAssignment = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 };
      transaction.set(ref, next);
      return next;
    });
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
    return listDocs<ModuleEnablementRule>(applyModuleRuleFilters(moduleRulesCollection(), filters));
  }

  async getModuleRuleById(id: string) {
    const snapshot = await moduleRulesCollection().doc(id).get();
    return snapshot.exists ? snapshot.data() as ModuleEnablementRule : null;
  }

  async createModuleRule(input: CreateModuleEnablementRuleInput) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const record: ModuleEnablementRule = { ...input, createdAt, updatedAt: input.updatedAt ?? createdAt, version: input.version ?? 1 };
    await moduleRulesCollection().doc(record.id).set(record);
    return record;
  }

  async updateModuleRule(id: string, patch: UpdateModuleEnablementRuleInput) {
    const ref = moduleRulesCollection().doc(id);
    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('module_rule_not_found');
      const existing = snapshot.data() as ModuleEnablementRule;
      if (typeof patch.expectedVersion === 'number' && existing.version !== patch.expectedVersion) throw new Error('module_rule_version_conflict');
      const next: ModuleEnablementRule = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, createdBy: existing.createdBy, updatedAt: new Date().toISOString(), version: existing.version + 1 };
      transaction.set(ref, next);
      return next;
    });
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
}
