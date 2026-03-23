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
  return { environment: process.env.NODE_ENV ?? 'development', tenantId: input.session.activeTenant.id, workspaceId: input.session.activeWorkspace?.id, userId: input.session.user.id, roleCodes: input.session.roles.map((role) => role.code), enabledModules: input.session.enabledModules, currentModule: input.currentModule, currentRoute: input.currentRoute, isInternalUser: input.internalUser, correlationId: input.correlationId };
}

export class FeatureFlagService {
  constructor(private readonly repository: ControlPlaneRepository = getControlPlaneRepository()) {}

  async evaluateFlag(flagKey: string, context: FeatureEvaluationContext, visited = new Set<string>(), runtime?: { assignments?: FeatureFlagAssignment[]; rolloutRules?: PercentageRolloutRule[]; }): Promise<FeatureEvaluationResult> {
    const reasons: FeatureEvaluationReason[] = [];
    if (visited.has(flagKey)) return { flagKey, exists: true, enabled: false, value: false, source: 'cycle_guard', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['cyclic_reference'], reasons: [reason('cyclic_reference', 'validation', 'Cyclic dependency detected.', 'cycle_guard')], dependenciesSatisfied: false, conflictsDetected: [] };
    visited.add(flagKey);
    const definition = getFeatureFlagDefinition(flagKey);
    if (!definition) return { flagKey, exists: false, enabled: false, value: false, source: 'missing_definition', scopeType: 'definition', releaseStage: 'deprecated', isKillSwitch: false, reasonCodes: ['missing_definition'], reasons: [reason('missing_definition', 'validation', 'Flag definition was not found.', 'definition')], dependenciesSatisfied: false, conflictsDetected: [] };

    const assignmentPool = (runtime?.assignments ?? await this.repository.listAssignmentsForFlag(flagKey, { enabled: true })).filter((item) => item.flagKey === flagKey && item.enabled && isActiveWindow(item));
    const rolloutPool = (runtime?.rolloutRules ?? await this.repository.listRolloutRulesForFlag(flagKey, { enabled: true })).filter((item) => item.flagKey === flagKey && item.enabled && isActiveWindow(item));

    const killAssignment = definition.isKillSwitch ? this.pickAssignment(assignmentPool, context) : null;
    if (definition.isKillSwitch && Boolean(killAssignment?.value)) {
      reasons.push(reason('kill_switch_active', 'kill_switch', 'Kill switch override is active.', 'assignment', { scopeType: killAssignment.scopeType, scopeId: killAssignment.scopeId }));
      return { flagKey, exists: true, enabled: true, value: true, source: 'kill_switch_override', scopeType: killAssignment.scopeType, scopeId: killAssignment.scopeId, releaseStage: killAssignment.releaseStage ?? definition.releaseStage, isKillSwitch: true, reasonCodes: reasons.map((item) => item.code), reasons, dependenciesSatisfied: true, conflictsDetected: [] };
    }

    const assignments = (await this.repository.listAssignmentsForFlag(flagKey, { enabled: true })).filter((item) => isActiveWindow(item));
    const killSwitch = definition.isKillSwitch ? this.pickAssignment(assignments, context) : null;
    if (definition.isKillSwitch && Boolean(killSwitch?.value)) {
      return { flagKey, exists: true, enabled: true, value: true, source: 'kill_switch_override', scopeType: killSwitch.scopeType, scopeId: killSwitch.scopeId, releaseStage: killSwitch.releaseStage ?? definition.releaseStage, isKillSwitch: true, reasonCodes: ['kill_switch_active'], dependenciesSatisfied: true, conflictsDetected: [] };
    }

    if (definition.isInternalOnly && !context.isInternalUser) reasons.push(reason('internal_only', 'release_stage', 'Feature is internal-only.', 'definition'));
    if (releaseStage === 'internal' && !context.isInternalUser) reasons.push(reason('release_stage_internal', 'release_stage', 'Release stage is internal.', 'definition'));
    if ((releaseStage === 'beta' || releaseStage === 'experimental' || releaseStage === 'limited') && !explicit && !rolloutDecision?.matched && !context.isInternalUser) reasons.push(reason('release_stage_restricted', 'release_stage', 'Release stage requires targeted rollout.', 'definition'));

    const dependencies = await Promise.all(definition.dependencies.map((dependency) => this.evaluateFlag(dependency, context, new Set(visited), runtime)));
    const dependenciesSatisfied = dependencies.every((item) => item.enabled);
    if (!dependenciesSatisfied) reasons.push(reason('missing_dependency', 'dependency', 'Required dependency is not enabled.', 'definition', { details: { dependencies: dependencies.filter((item) => !item.enabled).map((item) => item.flagKey) } }));

    const conflicts = await Promise.all(definition.conflicts.map((conflict) => this.evaluateFlag(conflict, context, new Set(visited), runtime)));
    const conflictsDetected = conflicts.filter((item) => item.enabled).map((item) => item.flagKey);
    if (conflictsDetected.length > 0) reasons.push(reason('conflict_detected', 'conflict', 'Conflicting feature is enabled.', 'definition', { details: { conflicts: conflictsDetected } }));

    const enabled = Boolean(value) && reasons.every((item) => !['internal_only', 'release_stage_internal', 'release_stage_restricted', 'missing_dependency', 'conflict_detected', 'rollout_conflict'].includes(item.code));
    return { flagKey, exists: true, enabled, value, source, scopeType, scopeId, releaseStage, isKillSwitch: definition.isKillSwitch, reasonCodes: reasons.map((item) => item.code), reasons, bucketResult, dependenciesSatisfied, conflictsDetected };
  }

  async evaluateFlags(flagKeys: string[], context: FeatureEvaluationContext, runtime?: { assignments?: FeatureFlagAssignment[]; rolloutRules?: PercentageRolloutRule[]; }) { return Promise.all(flagKeys.map((flagKey) => this.evaluateFlag(flagKey, context, new Set<string>(), runtime))); }
  async getEffectiveFlags(context: FeatureEvaluationContext) { const evaluated = await this.evaluateFlags(FEATURE_FLAG_DEFINITIONS.map((item) => item.key), context); return Object.fromEntries(evaluated.map((item) => [item.flagKey, item.enabled])); }
  async getFeatureCatalog(): Promise<FeatureCatalogEntry[]> { return FEATURE_FLAG_DEFINITIONS.map((item) => ({ flagKey: item.key, name: item.name, description: item.description, category: item.category, releaseStage: item.releaseStage, currentDefaultValue: item.defaultValue, scopesSupported: item.allowedScopes, isKillSwitch: item.isKillSwitch, isDeprecated: item.isDeprecated, owner: item.owner, tags: item.tags, dependencies: item.dependencies, conflicts: item.conflicts, supportsPercentageRollout: item.flagType === 'boolean' || item.flagType === 'percentage' })); }
  async listAssignments(flagKey?: string) { return this.repository.listAssignments(flagKey ? { flagKey } : undefined); }
  async listRolloutRules(flagKey?: string) { return this.repository.listRolloutRules(flagKey ? { flagKey } : undefined); }
  async listModuleRules(moduleKey?: string) { return this.repository.listModuleRules(moduleKey ? { moduleKey } : undefined); }

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

    for (const item of moduleRules) {
      if (!item.enabled) issues.push({ id: `module-disabled-${item.id}`, area: 'module_control', targetKey: item.moduleKey, severity: 'info', type: 'disabled_override', summary: 'Disabled module rule remains in the control plane.', detail: `${item.moduleKey} has a disabled rule for ${item.scopeType}:${item.scopeId}.`, status: 'disabled', relatedIds: [item.id] });
      if (isExpiredWindow(item)) issues.push({ id: `module-expired-${item.id}`, area: 'module_control', targetKey: item.moduleKey, severity: 'warning', type: 'expired_rule', summary: 'Expired module rule still present.', detail: `${item.moduleKey} rule for ${item.scopeType}:${item.scopeId} is expired and should be cleaned up.`, status: 'expired', relatedIds: [item.id] });
      if (isScheduledWindow(item) && item.enabled) issues.push({ id: `module-scheduled-${item.id}`, area: 'module_control', targetKey: item.moduleKey, severity: 'info', type: 'scheduled_rule', summary: 'Future module rule is scheduled.', detail: `${item.moduleKey} rule for ${item.scopeType}:${item.scopeId} has not started yet.`, status: 'scheduled', relatedIds: [item.id] });
      if (item.visible && item.enabled === false) issues.push({ id: `module-inconsistent-${item.id}`, area: 'module_control', targetKey: item.moduleKey, severity: 'warning', type: 'module_inconsistent_state', summary: 'Module rule is visible but disabled.', detail: `${item.moduleKey} stays visible while disabled for ${item.scopeType}:${item.scopeId}, which can confuse operators and users.`, status: 'active', relatedIds: [item.id] });
    }

    for (const evaluation of evaluations) {
      const activeAssignments = assignments.filter((entry) => entry.flagKey === evaluation.flagKey && entry.enabled && isActiveWindow(entry));
      const activeRollouts = rolloutRules.filter((entry) => entry.flagKey === evaluation.flagKey && entry.enabled && isActiveWindow(entry));
      const conflictAssignments = new Map<string, string[]>();
      for (const entry of activeAssignments) {
        const key = `${entry.scopeType}:${entry.scopeId}`;
        conflictAssignments.set(key, [...(conflictAssignments.get(key) ?? []), entry.id]);
      }
      for (const [scopeKey, ids] of conflictAssignments) {
        if (ids.length > 1) issues.push({ id: `assignment-conflict-${evaluation.flagKey}-${scopeKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'critical', type: 'conflicting_assignment', summary: 'Multiple active assignments target the same scope.', detail: `${evaluation.flagKey} has ${ids.length} active assignments for ${scopeKey}.`, status: 'active', relatedIds: ids });
      }
      const conflictRollouts = new Map<string, string[]>();
      for (const entry of activeRollouts) {
        const key = `${entry.scopeType}:${entry.scopeId}`;
        conflictRollouts.set(key, [...(conflictRollouts.get(key) ?? []), entry.id]);
      }
      for (const [scopeKey, ids] of conflictRollouts) {
        if (ids.length > 1) issues.push({ id: `rollout-conflict-${evaluation.flagKey}-${scopeKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'critical', type: 'conflicting_rollout', summary: 'Multiple active rollout rules target the same scope.', detail: `${evaluation.flagKey} has ${ids.length} rollout rules for ${scopeKey}.`, status: 'active', relatedIds: ids });
      }
      if (!evaluation.dependenciesSatisfied) issues.push({ id: `dependency-${evaluation.flagKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'warning', type: 'dependency_blocked', summary: 'Feature is blocked by a missing dependency.', detail: `${evaluation.flagKey} cannot evaluate to enabled because one or more dependencies are not enabled.`, status: 'active', relatedIds: [] });
      if (evaluation.conflictsDetected.length > 0) issues.push({ id: `conflict-${evaluation.flagKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'warning', type: 'conflict_blocked', summary: 'Feature is blocked by an active conflicting flag.', detail: `${evaluation.flagKey} conflicts with ${evaluation.conflictsDetected.join(', ')}.`, status: 'active', relatedIds: [] });
      const definition = catalog.find((entry) => entry.flagKey === evaluation.flagKey);
      if (definition?.isDeprecated && (activeAssignments.length > 0 || activeRollouts.length > 0)) issues.push({ id: `deprecated-${evaluation.flagKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'warning', type: 'deprecated_override', summary: 'Deprecated feature still has active overrides.', detail: `${evaluation.flagKey} is deprecated but still has active control-plane state.`, status: 'active', relatedIds: [...activeAssignments.map((entry) => entry.id), ...activeRollouts.map((entry) => entry.id)] });
      if (definition?.isKillSwitch && evaluation.enabled) issues.push({ id: `kill-${evaluation.flagKey}`, area: 'feature_flag', targetKey: evaluation.flagKey, severity: 'critical', type: 'kill_switch_active', summary: 'Kill switch is currently active.', detail: `${evaluation.flagKey} is actively forcing a protective stop.`, status: 'active', relatedIds: activeAssignments.map((entry) => entry.id) });
    }

    return issues.sort((a, b) => `${a.severity}:${a.summary}`.localeCompare(`${b.severity}:${b.summary}`));
  }

  private validateAssignmentInput(input: Omit<FeatureFlagAssignment, 'id' | 'createdAt' | 'updatedAt' | 'version'> | FeatureFlagAssignment) { const definition = getFeatureFlagDefinition(input.flagKey); if (!definition) throw new Error('unknown_flag'); if (!definition.allowedScopes.includes(input.scopeType)) throw new Error('unsupported_scope'); if (!isKnownScopeTarget(input.scopeType, input.scopeId)) throw new Error('invalid_scope_target'); if (definition.flagType === 'boolean' && typeof input.value !== 'boolean') throw new Error('invalid_boolean_value'); if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window'); if (definition.isKillSwitch && !input.reason?.trim()) throw new Error('reason_required'); }
  private validateRolloutRuleInput(input: Omit<PercentageRolloutRule, 'id' | 'createdAt' | 'updatedAt' | 'version'> | PercentageRolloutRule) { const definition = getFeatureFlagDefinition(input.flagKey); if (!definition) throw new Error('unknown_flag'); if (!definition.allowedScopes.includes(input.scopeType)) throw new Error('unsupported_scope'); if (!isKnownScopeTarget(input.scopeType, input.scopeId)) throw new Error('invalid_scope_target'); if (!Number.isInteger(input.percentage) || input.percentage < 0 || input.percentage > 100) throw new Error('invalid_percentage'); if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window'); if (!input.reason?.trim()) throw new Error('reason_required'); }
  private validateModuleRuleInput(input: Omit<ModuleEnablementRule, 'id' | 'createdAt' | 'updatedAt' | 'version'> | ModuleEnablementRule) { const module = listModuleDefinitions().find((item) => item.key === input.moduleKey); if (!module) throw new Error('unknown_module'); if (!isKnownScopeTarget(input.scopeType, input.scopeId)) throw new Error('invalid_scope_target'); if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) throw new Error('invalid_schedule_window'); if ((input.internalOnly || input.betaOnly || input.enabled === false) && !input.reason?.trim()) throw new Error('reason_required'); }
  private pickAssignment(assignments: FeatureFlagAssignment[], context: FeatureEvaluationContext) { const ordered = [...assignments].sort((a, b) => PRECEDENCE.indexOf(a.scopeType) - PRECEDENCE.indexOf(b.scopeType)); return ordered.find((item) => this.matchesScope(item.scopeType, item.scopeId, context)) ?? null; }
  private pickRolloutRule(rules: PercentageRolloutRule[], context: FeatureEvaluationContext, flagKey: string) { const matchedRules = [...rules].filter((item) => this.matchesScope(item.scopeType, item.scopeId, context)).sort((a, b) => PRECEDENCE.indexOf(a.scopeType) - PRECEDENCE.indexOf(b.scopeType)); if (!matchedRules.length) return null; const winningScope = matchedRules[0].scopeType; const sameScope = matchedRules.filter((item) => item.scopeType === winningScope); if (sameScope.length > 1) return { rule: sameScope[0], matched: false, conflict: sameScope[1] }; const rule = sameScope[0]; const identity = buildRolloutTargetIdentity(context, rule.bucketBy); if (!identity) return { rule, matched: false, bucketResult: undefined }; const bucketResult = evaluateDeterministicBucket({ flagKey, identity, percentage: rule.percentage, salt: rule.salt }); return { rule, matched: bucketResult.matched, bucketResult } as const; }
  private pickModuleRule(rules: ModuleEnablementRule[], context: FeatureEvaluationContext) { const ordered = [...rules].sort((a, b) => PRECEDENCE.indexOf(a.scopeType as FeatureScopeType) - PRECEDENCE.indexOf(b.scopeType as FeatureScopeType)); return ordered.find((item) => this.matchesScope(item.scopeType as FeatureScopeType, item.scopeId, context)) ?? null; }
  private matchesScope(scopeType: FeatureScopeType, scopeId: string, context: FeatureEvaluationContext) { if (scopeType === 'environment') return scopeId === context.environment; if (scopeType === 'tenant') return scopeId === context.tenantId; if (scopeType === 'workspace') return Boolean(context.workspaceId) && scopeId === context.workspaceId; if (scopeType === 'user') return Boolean(context.userId) && scopeId === context.userId; if (scopeType === 'module') return Boolean(context.currentModule) && scopeId === context.currentModule; if (scopeType === 'role') return context.roleCodes.includes(scopeId); return false; }
  private flagForModule(moduleKey: string) { return ({ dashboard: 'feature.dashboard.enabled', customers: 'feature.customers.enabled', applications: 'feature.applications.enabled', loans: 'feature.loans.enabled', documents: 'feature.documents.enabled', finance: 'feature.finance.enabled', support: 'feature.support.enabled', analytics: 'feature.analytics.enabled', settings: 'feature.module.settings.enabled', admin: 'feature.module.admin.enabled' } as Record<string, string | undefined>)[moduleKey]; }
}
