import { FEATURE_FLAG_DEFINITIONS, getFeatureFlagDefinition } from '@/lib/feature-flags/definitions';
import { getControlPlaneRepository } from '@/lib/feature-flags/store';
import type { ControlPlaneRepository } from '@/lib/feature-flags/repository';
import type { FeatureCatalogEntry, FeatureEvaluationContext, FeatureEvaluationResult, FeatureFlagAssignment, FeatureScopeType, ModuleAccessControlResult, ModuleEnablementRule, ReleaseStage } from '@/lib/feature-flags/types';
import { getTenantById, getWorkspacesForTenant, listModuleDefinitions, listPlatformRoles } from '@/lib/platform/bootstrap';
import { canPermission } from '@/lib/platform/permissions';
import type { PermissionGrant, PlatformSession } from '@/lib/platform/types';

const PRECEDENCE: FeatureScopeType[] = ['user', 'role', 'workspace', 'tenant', 'module', 'environment'];

function isActiveWindow(item: { startsAt?: string; endsAt?: string }) {
  const now = Date.now();
  if (item.startsAt && new Date(item.startsAt).getTime() > now) return false;
  if (item.endsAt && new Date(item.endsAt).getTime() < now) return false;
  return true;
}

function isKnownScopeTarget(scopeType: FeatureScopeType, scopeId: string) {
  if (!scopeId) return false;
  if (scopeType === 'environment') return true;
  if (scopeType === 'tenant') return Boolean(getTenantById(scopeId));
  if (scopeType === 'workspace') return [getWorkspacesForTenant('ten_rbp_internal'), getWorkspacesForTenant('ten_acme_customer')].flat().some((workspace) => workspace.id === scopeId);
  if (scopeType === 'role') return listPlatformRoles().some((role) => role.code === scopeId || role.id === scopeId);
  if (scopeType === 'user') return scopeId.startsWith('usr_');
  if (scopeType === 'module') return listModuleDefinitions().some((module) => module.key === scopeId);
  return false;
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
  constructor(private readonly repository: ControlPlaneRepository = getControlPlaneRepository()) {}

  async evaluateFlag(flagKey: string, context: FeatureEvaluationContext, visited = new Set<string>()): Promise<FeatureEvaluationResult> {
    if (visited.has(flagKey)) {
      return { flagKey, exists: true, enabled: false, value: false, source: 'cycle_guard', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['cyclic_reference'], dependenciesSatisfied: false, conflictsDetected: [] };
    }
    visited.add(flagKey);
    const definition = getFeatureFlagDefinition(flagKey);
    if (!definition) {
      return { flagKey, exists: false, enabled: false, value: false, source: 'missing_definition', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['missing_definition'], dependenciesSatisfied: false, conflictsDetected: [] };
    }

    const assignments = (await this.repository.listAssignmentsForFlag(flagKey, { enabled: true })).filter((item) => isActiveWindow(item));
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
    return this.repository.listAssignments(flagKey ? { flagKey } : undefined);
  }

  async saveAssignment(input: Omit<FeatureFlagAssignment, 'id' | 'createdAt' | 'updatedAt' | 'version'> & { id?: string; version?: number }) {
    this.validateAssignmentInput(input);
    const duplicate = (await this.repository.listAssignments({ flagKey: input.flagKey, scopeType: input.scopeType, scopeId: input.scopeId })).find((item) => item.enabled);
    if (duplicate && input.id !== duplicate.id) throw new Error('assignment_conflict');
    const now = new Date().toISOString();
    return this.repository.createAssignment({ ...input, id: input.id ?? `ffa_${crypto.randomUUID()}`, createdAt: now, updatedAt: now, version: input.version ?? 1 });
  }

  async updateAssignment(id: string, patch: Partial<FeatureFlagAssignment> & { expectedVersion?: number }) {
    const existing = await this.repository.getAssignmentById(id);
    if (!existing) throw new Error('assignment_not_found');
    const next = { ...existing, ...patch };
    this.validateAssignmentInput(next);
    return this.repository.updateAssignment(id, patch);
  }

  async disableAssignment(id: string, input: { updatedBy: string; expectedVersion?: number }) {
    return this.repository.disableAssignment(id, input);
  }

  async evaluateModule(moduleKey: string, input: { tenant: any; workspace?: any; permissions: PermissionGrant[]; internalUser: boolean; featureContext: FeatureEvaluationContext }): Promise<ModuleAccessControlResult> {
    const module = listModuleDefinitions().find((item) => item.key === moduleKey);
    if (!module) return { moduleKey, exists: false, enabled: false, visible: false, source: 'missing_definition', internalOnly: false, betaOnly: false, reasonCodes: ['missing_definition'], dependsOnFlags: [], dependsOnModules: [] };
    const rules = (await this.repository.listRulesForModule(moduleKey)).filter((item) => isActiveWindow(item));
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
    return { moduleKey, exists: true, enabled: reasons.length === 0 && ruleEnabled, visible: reasons.filter((item) => item !== 'permission_denied').length === 0 && ruleVisible, source: applied ? 'module_rule' : 'module_definition', internalOnly: applied?.internalOnly ?? module.isInternalOnly, betaOnly: applied?.betaOnly ?? Boolean((module as any).isBeta), reasonCodes: reasons, dependsOnFlags: featureCheck ? [featureCheck.flagKey] : [], dependsOnModules: [], releaseStage: featureCheck?.releaseStage, defaultLanding: applied?.defaultLanding };
  }

  async getEffectiveModules(input: { tenant: any; workspace?: any; permissions: PermissionGrant[]; internalUser: boolean; featureContext: FeatureEvaluationContext }) {
    const all = await Promise.all(listModuleDefinitions().map((module) => this.evaluateModule(module.key, input)));
    return all.filter((item) => item.visible && item.enabled);
  }

  async listModuleRules(moduleKey?: string) {
    return this.repository.listModuleRules(moduleKey ? { moduleKey } : undefined);
  }

  async saveModuleRule(input: Omit<ModuleEnablementRule, 'id' | 'createdAt' | 'updatedAt' | 'version'> & { id?: string; version?: number }) {
    this.validateModuleRuleInput(input);
    const duplicate = (await this.repository.listModuleRules({ moduleKey: input.moduleKey, scopeType: input.scopeType, scopeId: input.scopeId })).find((item) => item.enabled || item.visible);
    if (duplicate && input.id !== duplicate.id) throw new Error('module_rule_conflict');
    const now = new Date().toISOString();
    return this.repository.createModuleRule({ ...input, id: input.id ?? `mcr_${crypto.randomUUID()}`, createdAt: now, updatedAt: now, version: input.version ?? 1 });
  }

  async updateModuleRule(id: string, patch: Partial<ModuleEnablementRule> & { expectedVersion?: number }) {
    const existing = await this.repository.getModuleRuleById(id);
    if (!existing) throw new Error('module_rule_not_found');
    const next = { ...existing, ...patch };
    this.validateModuleRuleInput(next);
    return this.repository.updateModuleRule(id, patch);
  }

  async disableModuleRule(id: string, input: { updatedBy: string; expectedVersion?: number }) {
    return this.repository.disableModuleRule(id, input);
  }

  private validateAssignmentInput(input: Omit<FeatureFlagAssignment, 'id' | 'createdAt' | 'updatedAt' | 'version'> | FeatureFlagAssignment) {
    const definition = getFeatureFlagDefinition(input.flagKey);
    if (!definition) throw new Error('unknown_flag');
    if (!definition.allowedScopes.includes(input.scopeType)) throw new Error('unsupported_scope');
    if (!isKnownScopeTarget(input.scopeType, input.scopeId)) throw new Error('invalid_scope_target');
    if (definition.flagType === 'boolean' && typeof input.value !== 'boolean') throw new Error('invalid_boolean_value');
    if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window');
    if (definition.isKillSwitch && !input.reason?.trim()) throw new Error('reason_required');
  }

  private validateModuleRuleInput(input: Omit<ModuleEnablementRule, 'id' | 'createdAt' | 'updatedAt' | 'version'> | ModuleEnablementRule) {
    const module = listModuleDefinitions().find((item) => item.key === input.moduleKey);
    if (!module) throw new Error('unknown_module');
    if (!isKnownScopeTarget(input.scopeType, input.scopeId)) throw new Error('invalid_scope_target');
    if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window');
    if ((input.internalOnly || input.betaOnly || input.enabled === false) && !input.reason?.trim()) throw new Error('reason_required');
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
