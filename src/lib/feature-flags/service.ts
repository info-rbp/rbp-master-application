import { FEATURE_FLAG_DEFINITIONS, getFeatureFlagDefinition } from '@/lib/feature-flags/definitions';
import { getFeatureFlagStore } from '@/lib/feature-flags/store';
import type { FeatureCatalogEntry, FeatureEvaluationContext, FeatureEvaluationResult, FeatureFlagAssignment, FeatureFlagDefinition, FeatureScopeType, ModuleAccessControlResult, ModuleEnablementRule, ReleaseStage } from '@/lib/feature-flags/types';
import { listModuleDefinitions } from '@/lib/platform/bootstrap';
import { canPermission } from '@/lib/platform/permissions';
import type { ModuleDefinition, PermissionGrant, PlatformSession, Role } from '@/lib/platform/types';

const PRECEDENCE: FeatureScopeType[] = ['user', 'role', 'workspace', 'tenant', 'module', 'environment'];

function stageRank(stage: ReleaseStage) {
  return ['experimental', 'internal', 'beta', 'limited', 'general_availability', 'deprecated'].indexOf(stage);
}

function isActiveWindow(item: { startsAt?: string; endsAt?: string }) {
  const now = Date.now();
  if (item.startsAt && new Date(item.startsAt).getTime() > now) return false;
  if (item.endsAt && new Date(item.endsAt).getTime() < now) return false;
  return true;
}

export function buildFeatureEvaluationContext(input: { session: PlatformSession; internalUser: boolean; correlationId: string; currentModule?: string; currentRoute?: string }): FeatureEvaluationContext {
  return {
    environment: process.env.NODE_ENV ?? 'development',
    tenantId: input.session.activeTenant.id,
    workspaceId: input.session.activeWorkspace?.id,
    userId: input.session.user.id,
    roleCodes: input.session.roles.map((role) => role.code),
    enabledModules: input.session.enabledModules,
    currentModule: input.currentModule,
    currentRoute: input.currentRoute,
    isInternalUser: input.internalUser,
    correlationId: input.correlationId,
  };
}

export class FeatureFlagService {
  private readonly store = getFeatureFlagStore();

  async evaluateFlag(flagKey: string, context: FeatureEvaluationContext, visited = new Set<string>()): Promise<FeatureEvaluationResult> {
    if (visited.has(flagKey)) {
      return { flagKey, exists: true, enabled: false, value: false, source: 'cycle_guard', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['cyclic_reference'], dependenciesSatisfied: false, conflictsDetected: [] };
    }
    visited.add(flagKey);
    const definition = getFeatureFlagDefinition(flagKey);
    if (!definition) {
      return { flagKey, exists: false, enabled: false, value: false, source: 'missing_definition', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['missing_definition'], dependenciesSatisfied: false, conflictsDetected: [] };
    }

    const assignments = (await this.store.listAssignments()).filter((item) => item.flagKey === flagKey && item.enabled && isActiveWindow(item));
    const killSwitch = definition.isKillSwitch ? this.pickAssignment(assignments, context) : null;
    if (definition.isKillSwitch && Boolean(killSwitch?.value)) {
      return { flagKey, exists: true, enabled: true, value: true, source: 'kill_switch_override', scopeType: killSwitch.scopeType, scopeId: killSwitch.scopeId, releaseStage: killSwitch.releaseStage ?? definition.releaseStage, isKillSwitch: true, reasonCodes: ['kill_switch_active'], dependenciesSatisfied: true, conflictsDetected: [] };
    }

    const applied = this.pickAssignment(assignments, context);
    const releaseStage = applied?.releaseStage ?? definition.releaseStage;
    const reasonCodes: string[] = [];
    if (definition.isInternalOnly && !context.isInternalUser) reasonCodes.push('internal_only');
    if (releaseStage === 'internal' && !context.isInternalUser) reasonCodes.push('release_stage_internal');
    if ((releaseStage === 'beta' || releaseStage === 'experimental' || releaseStage === 'limited') && !applied && !context.isInternalUser) reasonCodes.push('release_stage_restricted');

    const dependencies = await Promise.all(definition.dependencies.map((dependency) => this.evaluateFlag(dependency, context, new Set(visited))));
    const dependenciesSatisfied = dependencies.every((item) => item.enabled);
    if (!dependenciesSatisfied) reasonCodes.push('missing_dependency');

    const conflicts = await Promise.all(definition.conflicts.map((conflict) => this.evaluateFlag(conflict, context, new Set(visited))));
    const conflictsDetected = conflicts.filter((item) => item.enabled).map((item) => item.flagKey);
    if (conflictsDetected.length > 0) reasonCodes.push('conflict_detected');

    const value = applied?.value ?? definition.defaultValue;
    const enabled = Boolean(value) && reasonCodes.length === 0;
    return { flagKey, exists: true, enabled, value, source: applied ? 'assignment' : 'definition_default', scopeType: applied?.scopeType ?? 'definition', scopeId: applied?.scopeId, releaseStage, isKillSwitch: definition.isKillSwitch, reasonCodes, dependenciesSatisfied, conflictsDetected };
  }

  async evaluateFlags(flagKeys: string[], context: FeatureEvaluationContext) {
    return Promise.all(flagKeys.map((flagKey) => this.evaluateFlag(flagKey, context)));
  }

  async getEffectiveFlags(context: FeatureEvaluationContext) {
    const evaluated = await this.evaluateFlags(FEATURE_FLAG_DEFINITIONS.map((item) => item.key), context);
    return Object.fromEntries(evaluated.map((item) => [item.flagKey, item.enabled]));
  }

  async getFeatureCatalog(): Promise<FeatureCatalogEntry[]> {
    return FEATURE_FLAG_DEFINITIONS.map((item) => ({ flagKey: item.key, name: item.name, description: item.description, category: item.category, releaseStage: item.releaseStage, currentDefaultValue: item.defaultValue, scopesSupported: item.allowedScopes, isKillSwitch: item.isKillSwitch, isDeprecated: item.isDeprecated, owner: item.owner, tags: item.tags, dependencies: item.dependencies, conflicts: item.conflicts }));
  }

  async listAssignments(flagKey?: string) {
    return (await this.store.listAssignments()).filter((item) => !flagKey || item.flagKey === flagKey);
  }

  async saveAssignment(input: Omit<FeatureFlagAssignment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const definition = getFeatureFlagDefinition(input.flagKey);
    if (!definition) throw new Error('unknown_flag');
    if (!definition.allowedScopes.includes(input.scopeType)) throw new Error('unsupported_scope');
    if (definition.flagType === 'boolean' && typeof input.value !== 'boolean') throw new Error('invalid_boolean_value');
    if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window');
    const now = new Date().toISOString();
    const assignment: FeatureFlagAssignment = { ...input, id: input.id ?? `ffa_${crypto.randomUUID()}`, createdAt: now, updatedAt: now };
    await this.store.saveAssignment(assignment);
    return assignment;
  }

  async updateAssignment(id: string, patch: Partial<FeatureFlagAssignment>) {
    const existing = await this.store.getAssignment(id);
    if (!existing) throw new Error('assignment_not_found');
    const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await this.store.saveAssignment(next);
    return next;
  }

  async evaluateModule(moduleKey: string, input: { tenant: any; workspace?: any; permissions: PermissionGrant[]; internalUser: boolean; featureContext: FeatureEvaluationContext }): Promise<ModuleAccessControlResult> {
    const module = listModuleDefinitions().find((item) => item.key === moduleKey);
    if (!module) return { moduleKey, exists: false, enabled: false, visible: false, source: 'missing_definition', internalOnly: false, betaOnly: false, reasonCodes: ['missing_definition'], dependsOnFlags: [], dependsOnModules: [] };
    const rules = (await this.store.listModuleRules()).filter((item) => item.moduleKey === moduleKey && isActiveWindow(item));
    const applied = this.pickModuleRule(rules, input.featureContext);
    const reasons: string[] = [];
    const featureKey = this.flagForModule(module.key);
    const featureCheck = featureKey ? await this.evaluateFlag(featureKey, input.featureContext) : null;
    if (featureCheck && !featureCheck.enabled) reasons.push(`flag:${featureCheck.flagKey}`);
    if (module.isInternalOnly && !input.internalUser) reasons.push('internal_only');
    if (applied?.internalOnly && !input.internalUser) reasons.push('rule_internal_only');
    if ((applied?.betaOnly || (module as any).isBeta) && !input.internalUser) reasons.push('beta_only');
    if (!(input.tenant.enabledModules.includes(module.key) || module.isEnabledByDefault)) reasons.push('tenant_disabled');
    if (input.workspace && input.workspace.enabledModules.length > 0 && !input.workspace.enabledModules.includes(module.key)) reasons.push('workspace_disabled');
    if (input.workspace && (module as any).workspaceTypes?.length && !(module as any).workspaceTypes.includes(input.workspace.workspaceType)) reasons.push('workspace_type_blocked');
    if (!module.requiredPermissions.every((permission) => canPermission(input.permissions, permission.resource, permission.action))) reasons.push('permission_denied');
    const ruleEnabled = applied ? applied.enabled : true;
    const ruleVisible = applied ? applied.visible : !module.isHidden;
    return {
      moduleKey,
      exists: true,
      enabled: reasons.length === 0 && ruleEnabled,
      visible: reasons.filter((item) => item !== 'permission_denied').length === 0 && ruleVisible,
      source: applied ? 'module_rule' : 'module_definition',
      internalOnly: applied?.internalOnly ?? module.isInternalOnly,
      betaOnly: applied?.betaOnly ?? Boolean((module as any).isBeta),
      reasonCodes: reasons,
      dependsOnFlags: featureCheck ? [featureCheck.flagKey] : [],
      dependsOnModules: [],
      releaseStage: featureCheck?.releaseStage,
      defaultLanding: applied?.defaultLanding,
    };
  }

  async getEffectiveModules(input: { tenant: any; workspace?: any; permissions: PermissionGrant[]; internalUser: boolean; featureContext: FeatureEvaluationContext }) {
    const all = await Promise.all(listModuleDefinitions().map((module) => this.evaluateModule(module.key, input)));
    return all.filter((item) => item.visible && item.enabled);
  }

  async listModuleRules(moduleKey?: string) {
    return (await this.store.listModuleRules()).filter((item) => !moduleKey || item.moduleKey === moduleKey);
  }

  async saveModuleRule(input: Omit<ModuleEnablementRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const now = new Date().toISOString();
    const rule: ModuleEnablementRule = { ...input, id: input.id ?? `mcr_${crypto.randomUUID()}`, createdAt: now, updatedAt: now };
    await this.store.saveModuleRule(rule);
    return rule;
  }

  async updateModuleRule(id: string, patch: Partial<ModuleEnablementRule>) {
    const existing = await this.store.getModuleRule(id);
    if (!existing) throw new Error('module_rule_not_found');
    const next = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await this.store.saveModuleRule(next);
    return next;
  }

  private pickAssignment(assignments: FeatureFlagAssignment[], context: FeatureEvaluationContext) {
    const ordered = [...assignments].sort((a, b) => PRECEDENCE.indexOf(a.scopeType) - PRECEDENCE.indexOf(b.scopeType));
    return ordered.find((item) => this.matchesScope(item.scopeType, item.scopeId, context)) ?? null;
  }

  private pickModuleRule(rules: ModuleEnablementRule[], context: FeatureEvaluationContext) {
    const ordered = [...rules].sort((a, b) => PRECEDENCE.indexOf(a.scopeType as FeatureScopeType) - PRECEDENCE.indexOf(b.scopeType as FeatureScopeType));
    return ordered.find((item) => this.matchesScope(item.scopeType as FeatureScopeType, item.scopeId, context)) ?? null;
  }

  private matchesScope(scopeType: FeatureScopeType, scopeId: string, context: FeatureEvaluationContext) {
    if (scopeType === 'environment') return scopeId === context.environment;
    if (scopeType === 'tenant') return scopeId === context.tenantId;
    if (scopeType === 'workspace') return Boolean(context.workspaceId) && scopeId === context.workspaceId;
    if (scopeType === 'user') return Boolean(context.userId) && scopeId === context.userId;
    if (scopeType === 'module') return Boolean(context.currentModule) && scopeId === context.currentModule;
    if (scopeType === 'role') return context.roleCodes.includes(scopeId);
    return false;
  }

  private flagForModule(moduleKey: string) {
    return ({ dashboard: 'feature.dashboard.enabled', customers: 'feature.customers.enabled', applications: 'feature.applications.enabled', loans: 'feature.loans.enabled', documents: 'feature.documents.enabled', finance: 'feature.finance.enabled', support: 'feature.support.enabled', analytics: 'feature.analytics.enabled', settings: 'feature.module.settings.enabled', admin: 'feature.module.admin.enabled' } as Record<string, string | undefined>)[moduleKey];
  }
}
