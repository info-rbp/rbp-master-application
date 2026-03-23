import { getFeatureFlagDefinition } from '@/lib/feature-flags/definitions';
import { FeatureFlagStore } from '@/lib/feature-flags/store';
import { listModuleDefinitions } from '@/lib/platform/bootstrap';
import type { ControlPlaneRepository } from '@/lib/feature-flags/repository';
import type { FeatureFlagAssignment, ModuleEnablementRule } from '@/lib/feature-flags/types';

function validateAssignment(record: FeatureFlagAssignment) {
  const definition = getFeatureFlagDefinition(record.flagKey);
  if (!definition) throw new Error(`unknown_flag:${record.flagKey}`);
  if (!definition.allowedScopes.includes(record.scopeType)) throw new Error(`unsupported_scope:${record.flagKey}:${record.scopeType}`);
  if (record.startsAt && record.endsAt && new Date(record.startsAt) > new Date(record.endsAt)) throw new Error(`invalid_schedule:${record.id}`);
}

function validateModuleRule(record: ModuleEnablementRule) {
  const module = listModuleDefinitions().find((item) => item.key === record.moduleKey);
  if (!module) throw new Error(`unknown_module:${record.moduleKey}`);
  if (record.startsAt && record.endsAt && new Date(record.startsAt) > new Date(record.endsAt)) throw new Error(`invalid_schedule:${record.id}`);
}

export async function importLegacyFeatureControlStore(input: { repository: ControlPlaneRepository; store?: FeatureFlagStore; actorId?: string; }): Promise<{ assignmentsImported: number; assignmentsSkipped: number; moduleRulesImported: number; moduleRulesSkipped: number; }> {
  const store = input.store ?? new FeatureFlagStore();
  const state = await store.read();
  let assignmentsImported = 0;
  let assignmentsSkipped = 0;
  let moduleRulesImported = 0;
  let moduleRulesSkipped = 0;

  for (const record of state.assignments) {
    validateAssignment(record);
    const existing = await input.repository.getAssignmentById(record.id);
    if (existing) {
      assignmentsSkipped += 1;
      continue;
    }
    await input.repository.createAssignment({ ...record, createdBy: record.createdBy || input.actorId || 'migration', updatedBy: record.updatedBy || input.actorId || 'migration', version: record.version ?? 1 });
    assignmentsImported += 1;
  }

  for (const record of state.moduleRules) {
    validateModuleRule(record);
    const existing = await input.repository.getModuleRuleById(record.id);
    if (existing) {
      moduleRulesSkipped += 1;
      continue;
    }
    await input.repository.createModuleRule({ ...record, createdBy: record.createdBy || input.actorId || 'migration', updatedBy: record.updatedBy || input.actorId || 'migration', version: record.version ?? 1 });
    moduleRulesImported += 1;
  }

  return { assignmentsImported, assignmentsSkipped, moduleRulesImported, moduleRulesSkipped };
}
