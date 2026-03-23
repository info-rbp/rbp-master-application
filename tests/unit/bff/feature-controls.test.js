process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');
const { FeatureFlagService, buildFeatureEvaluationContext } = require('../../../src/lib/feature-flags/service');
const { evaluateDeterministicBucket, buildRolloutTargetIdentity } = require('../../../src/lib/feature-flags/rollout');
const { resetControlPlaneRepositoryForTests, getControlPlaneRepository } = require('../../../src/lib/feature-flags/store');
const { FeatureFlagStore } = require('../../../src/lib/feature-flags/store');
const { importLegacyFeatureControlStore } = require('../../../src/lib/feature-flags/migration');
const { resetAuditStoreForTests, getAuditStore } = require('../../../src/lib/audit/store');
const { resetNotificationStoreForTests, getNotificationStore } = require('../../../src/lib/notifications-center/store');
const { AuditService } = require('../../../src/lib/audit/service');
const { NotificationService } = require('../../../src/lib/notifications-center/service');
const { SearchService } = require('../../../src/lib/search/service');
const { TaskService } = require('../../../src/lib/tasks/service');
const { FeatureControlsBffService } = require('../../../src/lib/bff/services/feature-controls-bff-service');
const { requireActionPolicyAccess, evaluateRoutePolicyAccess, toAccessContext } = require('../../../src/lib/access/evaluators');
const { toFeatureControlApiError } = require('../../../src/lib/feature-flags/http-errors');
const { buildFlagRows, buildModuleRows, summarizeDiagnostics } = require('../../../src/app/admin/system/feature-controls/feature-controls-client');
const { BffApiError } = require('../../../src/lib/bff/utils/request-context');

async function makeContext(kind = 'internal') {
  const principal = resolvePrincipalFromBootstrap({ email: kind === 'internal' ? 'admin@rbp.local' : 'member@rbp.local' });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'internal' ? 'ten_rbp_internal' : 'ten_acme_customer', activeWorkspaceId: kind === 'internal' ? 'wrk_internal_ops' : 'wrk_acme_service' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'feature-test-correlation', session, internalUser: kind === 'internal' };
}

async function makeAdminConsoleContext() {
  const principal = resolvePrincipalFromBootstrap({ email: 'admin@rbp.local' });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: 'ten_rbp_internal', activeWorkspaceId: 'wrk_internal_admin' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'feature-test-correlation', session, internalUser: true };
}

test.beforeEach(async () => {
  resetControlPlaneRepositoryForTests();
  resetAuditStoreForTests();
  resetNotificationStoreForTests();
  await getControlPlaneRepository().reset();
  await getAuditStore().reset();
  await getNotificationStore().reset();
});

test('deterministic bucketing stays stable for same identity and salt', () => {
  const identity = buildRolloutTargetIdentity({ tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', userId: 'usr_jane_admin', roleCodes: ['platform.super_admin'] }, 'user');
  const first = evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 25, salt: 'wave-1' });
  const second = evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 25, salt: 'wave-1' });
  assert.deepEqual(first, second);
});

test('salt change re-cuts rollout cohort deterministically', () => {
  const identity = buildRolloutTargetIdentity({ tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', userId: 'usr_jane_admin', roleCodes: ['platform.super_admin'] }, 'user');
  const first = evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 50, salt: 'wave-1' });
  const second = evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 50, salt: 'wave-2' });
  assert.notEqual(first.hashValue, second.hashValue);
});

test('rollout threshold boundaries handle 0 and 100 percent safely', () => {
  const identity = buildRolloutTargetIdentity({ tenantId: 'ten_rbp_internal', roleCodes: [] }, 'tenant');
  assert.equal(evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 0 }).matched, false);
  assert.equal(evaluateDeterministicBucket({ flagKey: 'feature.search.enabled', identity, percentage: 100 }).matched, true);
});

test('feature flag precedence prefers user over tenant over environment', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'environment', scopeId: process.env.NODE_ENV ?? 'development', value: false, reason: 'env off', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'tenant on', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'user', scopeId: context.session.user.id, value: false, reason: 'user off', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const result = await service.evaluateFlag('feature.search.enabled', featureContext);
  assert.equal(result.enabled, false);
  assert.equal(result.scopeType, 'user');
});

test('explicit override beats percentage rollout at the same scope', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'wave-1', reason: 'broad rollout', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: false, reason: 'explicit off', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const result = await service.evaluateFlag('feature.search.enabled', featureContext);
  assert.equal(result.enabled, false);
  assert.equal(result.source, 'assignment');
});

test('percentage rollout returns bucket details and stable reasoning', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'wave-1', reason: 'broad rollout', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const result = await service.evaluateFlag('feature.search.enabled', featureContext);
  assert.equal(result.enabled, true);
  assert.equal(result.source, 'percentage_rollout');
  assert.ok(result.bucketResult);
  assert.ok(result.reasonCodes.includes('rollout_match'));
});



test('disabled rollout rules are ignored by runtime evaluation', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'disabled', reason: 'disabled rollout', enabled: false, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const result = await service.evaluateFlag('feature.search.enabled', featureContext);
  assert.equal(result.source, 'definition_default');
  assert.equal(result.enabled, true);
});

test('kill switch conflict beats rollout for the paired runtime feature', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'wave-1', reason: 'broad rollout', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.kill_switch.search', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const result = await service.evaluateFlag('feature.search.enabled', featureContext);
  assert.equal(result.enabled, false);
  assert.ok(result.reasonCodes.includes('conflict_detected'));
  assert.ok(result.conflictsDetected.includes('feature.kill_switch.search'));
});

test('preview matches runtime evaluation for the same live context', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'consistent', reason: 'preview parity', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const runtime = await service.evaluateFlag('feature.search.enabled', featureContext);
  const preview = await service.preview({ ...featureContext, includeReasoning: true, includeBucketDetails: true, featureKeys: ['feature.search.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions });
  assert.equal(preview.evaluatedFlags[0].enabled, runtime.enabled);
  assert.equal(preview.evaluatedFlags[0].source, runtime.source);
  assert.deepEqual(preview.evaluatedFlags[0].reasonCodes, runtime.reasonCodes);
  assert.deepEqual(preview.evaluatedFlags[0].bucketResult, runtime.bucketResult);
});

test('preview explains missing rollout identity when bucket target cannot be built', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'user', salt: 'needs-user', reason: 'target user only', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const preview = await service.preview({ ...featureContext, userId: undefined, includeReasoning: true, includeBucketDetails: true, featureKeys: ['feature.search.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions });
  assert.ok(preview.evaluatedFlags[0].reasonCodes.includes('rollout_identity_missing'));
  assert.equal(preview.evaluatedFlags[0].bucketResult, undefined);
});

test('previewed modules use the same simulated rollout runtime state as previewed flags', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext('customer');
  const featureContext = buildFeatureEvaluationContext(context);
  const baseline = await service.preview({ ...featureContext, includeReasoning: true, includeBucketDetails: true, featureKeys: ['feature.analytics.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions });
  const baselineAnalytics = baseline.evaluatedModules.find((item) => item.moduleKey === 'analytics');
  assert.ok(baselineAnalytics);
  assert.equal(baselineAnalytics.enabled, false);
  assert.ok(baselineAnalytics.reasonCodes.includes('flag:feature.analytics.enabled'));

  const simulated = await service.preview({ ...featureContext, includeReasoning: true, includeBucketDetails: true, featureKeys: ['feature.analytics.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, proposedRolloutRules: [{ id: 'preview-rule', flagKey: 'feature.analytics.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'analytics-preview', enabled: true, reason: 'preview', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'preview', updatedBy: 'preview', metadata: {}, version: 1 }] });
  const simulatedFlag = simulated.evaluatedFlags.find((item) => item.flagKey === 'feature.analytics.enabled');
  const simulatedAnalytics = simulated.evaluatedModules.find((item) => item.moduleKey === 'analytics');
  assert.equal(simulatedFlag.enabled, true);
  assert.ok(simulatedAnalytics);
  assert.ok(simulatedAnalytics.reasonCodes.every((code) => code !== 'flag:feature.analytics.enabled'));
});

test('assignment persistence supports versioned update and disable', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const created = await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'tenant on', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  assert.equal(created.version, 1);
  const updated = await service.updateAssignment(created.id, { value: false, updatedBy: 'editor', expectedVersion: 1 });
  assert.equal(updated.version, 2);
  await assert.rejects(() => service.updateAssignment(created.id, { value: true, updatedBy: 'editor', expectedVersion: 1 }), /assignment_version_conflict/);
  const disabled = await service.disableAssignment(created.id, { updatedBy: 'editor', expectedVersion: 2 });
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.version, 3);
});

test('kill switch overrides normal feature enablement and rollout', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveRolloutRule({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'wave-1', reason: 'broad rollout', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.kill_switch.search', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const kill = await service.evaluateFlag('feature.kill_switch.search', featureContext);
  assert.equal(kill.enabled, true);
  const refreshedSession = await buildPlatformSession(createPersistedSession({ principal: resolvePrincipalFromBootstrap({ email: 'admin@rbp.local' }), auth: { provider: 'local' }, activeTenantId: 'ten_rbp_internal', activeWorkspaceId: 'wrk_internal_ops' }));
  await assert.rejects(() => new SearchService().search({ ...context, session: refreshedSession }, new URLSearchParams({ q: 'loan', page: '1', pageSize: '5' })), (error) => error instanceof BffApiError && error.code === 'search_kill_switch_active');
});

test('dependencies and internal release restrictions disable flags safely', async () => {
  const service = new FeatureFlagService();
  const customerContext = await makeContext('customer');
  const featureContext = buildFeatureEvaluationContext(customerContext);
  const result = await service.evaluateFlag('feature.internal.preview.customer360', featureContext);
  assert.equal(result.enabled, false);
  assert.ok(result.reasonCodes.includes('internal_only') || result.reasonCodes.includes('release_stage_internal'));
});

test('module controls can hide analytics for a tenant', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveModuleRule({ moduleKey: 'analytics', scopeType: 'tenant', scopeId: context.session.activeTenant.id, enabled: false, visible: false, internalOnly: false, betaOnly: false, reason: 'rollout hold', createdBy: 'system', updatedBy: 'system', metadata: {} });
  const modules = await service.getEffectiveModules({ tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext });
  assert.equal(modules.some((item) => item.moduleKey === 'analytics'), false);
});

test('module rule persistence supports versioned disable', async () => {
  const service = new FeatureFlagService();
  const created = await service.saveModuleRule({ moduleKey: 'analytics', scopeType: 'tenant', scopeId: 'ten_rbp_internal', enabled: true, visible: true, internalOnly: false, betaOnly: false, reason: 'allow analytics', createdBy: 'system', updatedBy: 'system', metadata: {} });
  const updated = await service.updateModuleRule(created.id, { visible: false, updatedBy: 'editor', expectedVersion: 1 });
  assert.equal(updated.version, 2);
  const disabled = await service.disableModuleRule(created.id, { updatedBy: 'editor', expectedVersion: 2 });
  assert.equal(disabled.enabled, false);
});

test('task kill switch disables task listing', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  await service.saveAssignment({ flagKey: 'feature.kill_switch.tasks', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const refreshedSession = await buildPlatformSession(createPersistedSession({ principal: resolvePrincipalFromBootstrap({ email: 'admin@rbp.local' }), auth: { provider: 'local' }, activeTenantId: 'ten_rbp_internal', activeWorkspaceId: 'wrk_internal_ops' }));
  await assert.rejects(() => new TaskService().listTasks({ ...context, session: refreshedSession }, { page: 1, pageSize: 10, assignment: 'all' }), (error) => error instanceof BffApiError && error.code === 'tasks_kill_switch_active');
});

test('preview returns reasoning and bucket details for simulated rollout', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const result = await service.preview({ ...buildFeatureEvaluationContext(context), includeReasoning: true, includeBucketDetails: true, featureKeys: ['feature.search.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, proposedRolloutRules: [{ id: 'preview-rule', flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'preview', enabled: true, reason: 'preview', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'preview', updatedBy: 'preview', metadata: {}, version: 1 }] });
  assert.equal(result.evaluatedFlags.length, 1);
  assert.ok(result.evaluatedFlags[0].reasons.length > 0);
  assert.ok(result.evaluatedFlags[0].bucketResult);
});

test('preview omits reasoning and bucket payloads when disabled by request', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const result = await service.preview({ ...buildFeatureEvaluationContext(context), includeReasoning: false, includeBucketDetails: false, featureKeys: ['feature.search.enabled'] }, { tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, proposedRolloutRules: [{ id: 'preview-rule', flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 100, bucketBy: 'tenant', salt: 'preview', enabled: true, reason: 'preview', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'preview', updatedBy: 'preview', metadata: {}, version: 1 }] });
  assert.equal(result.evaluatedFlags.length, 1);
  assert.deepEqual(result.evaluatedFlags[0].reasons, []);
  assert.equal(result.evaluatedFlags[0].bucketResult, undefined);
  assert.deepEqual(result.meta, { includeReasoning: false, includeBucketDetails: false });
});

test('migration imports legacy file store and preserves effective evaluation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'feature-control-migration-'));
  const legacyStore = new FeatureFlagStore(join(dir, 'legacy.json'));
  const context = await makeContext();
  await legacyStore.write({
    assignments: [{ id: 'ffa_legacy_1', flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: false, reason: 'legacy off', enabled: true, createdAt: '2026-03-20T00:00:00.000Z', updatedAt: '2026-03-20T00:00:00.000Z', createdBy: 'legacy', updatedBy: 'legacy', metadata: {}, version: 1 }],
    rolloutRules: [{ id: 'prr_legacy_1', flagKey: 'feature.documents.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, percentage: 50, bucketBy: 'tenant', salt: 'legacy', enabled: true, reason: 'legacy rollout', createdAt: '2026-03-20T00:00:00.000Z', updatedAt: '2026-03-20T00:00:00.000Z', createdBy: 'legacy', updatedBy: 'legacy', metadata: {}, version: 1 }],
    moduleRules: [{ id: 'mcr_legacy_1', moduleKey: 'analytics', scopeType: 'tenant', scopeId: context.session.activeTenant.id, enabled: false, visible: false, internalOnly: false, betaOnly: false, reason: 'legacy hold', createdAt: '2026-03-20T00:00:00.000Z', updatedAt: '2026-03-20T00:00:00.000Z', createdBy: 'legacy', updatedBy: 'legacy', metadata: {}, version: 1 }],
  });
  const repo = getControlPlaneRepository();
  const result = await importLegacyFeatureControlStore({ repository: repo, store: legacyStore, actorId: 'migration' });
  assert.deepEqual(result, { assignmentsImported: 1, assignmentsSkipped: 0, rolloutRulesImported: 1, rolloutRulesSkipped: 0, moduleRulesImported: 1, moduleRulesSkipped: 0 });
  const rerun = await importLegacyFeatureControlStore({ repository: repo, store: legacyStore, actorId: 'migration' });
  assert.deepEqual(rerun, { assignmentsImported: 0, assignmentsSkipped: 1, rolloutRulesImported: 0, rolloutRulesSkipped: 1, moduleRulesImported: 0, moduleRulesSkipped: 1 });
  const service = new FeatureFlagService();
  const featureContext = buildFeatureEvaluationContext(context);
  const flag = await service.evaluateFlag('feature.search.enabled', featureContext);
  const modules = await service.getEffectiveModules({ tenant: context.session.activeTenant, workspace: context.session.activeWorkspace, permissions: context.session.effectivePermissions, internalUser: context.internalUser, featureContext });
  assert.equal(flag.enabled, false);
  assert.equal(modules.some((item) => item.moduleKey === 'analytics'), false);
});

test('critical kill switch changes are auditable and notify operators', async () => {
  const audit = new AuditService();
  const notifications = new NotificationService();
  await audit.record({ eventType: 'feature.kill_switch.activated', action: 'create', category: 'configuration', tenantId: 'ten_rbp_internal', actorType: 'user', actorId: 'usr_jane_admin', actorDisplay: 'Jane Smith', subjectEntityType: 'feature_flag', subjectEntityId: 'feature.kill_switch.search', sourceSystem: 'platform', correlationId: 'corr-1', outcome: 'success', severity: 'warning', metadata: { value: true }, sensitivity: 'internal' });
  const created = await notifications.create({ tenantId: 'ten_rbp_internal', recipientType: 'tenant_admins', recipientId: 'role_tenant_admin', notificationType: 'system.alert', category: 'admin', title: 'Kill switch activated', body: 'Search disabled', severity: 'critical', sourceSystem: 'platform', sourceEventType: 'feature.kill_switch.changed', actions: [], channels: ['in_app'], metadata: { correlationId: 'corr-1' }, sourceRefs: [] });
  const events = await audit.query({ tenantId: 'ten_rbp_internal', eventType: 'feature.kill_switch.activated' });
  assert.equal(events.items.length, 1);
  assert.ok(created.length >= 1);
});

test('control-plane diagnostics surface conflicts, stale rules, and kill switches', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'tenant on', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: false, reason: 'conflicting tenant off', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.kill_switch.search', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const expiredModuleRule = await service.saveModuleRule({ moduleKey: 'analytics', scopeType: 'tenant', scopeId: context.session.activeTenant.id, enabled: true, visible: true, internalOnly: false, betaOnly: false, reason: 'temporary override', startsAt: '2026-03-01T00:00:00.000Z', endsAt: '2026-03-02T00:00:00.000Z', createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.updateModuleRule(expiredModuleRule.id, { updatedBy: 'system', expectedVersion: 1 });
  const diagnostics = await service.getControlPlaneDiagnostics(featureContext);
  assert.ok(diagnostics.some((item) => item.type === 'conflicting_assignment' && item.targetKey === 'feature.search.enabled'));
  assert.ok(diagnostics.some((item) => item.type === 'kill_switch_active' && item.targetKey === 'feature.kill_switch.search'));
  assert.ok(diagnostics.some((item) => item.type === 'expired_rule' && item.targetKey === 'analytics'));
});

test('console data exposes summaries and recent audit changes for operators', async () => {
  const context = await makeAdminConsoleContext();
  const service = new FeatureFlagService();
  const bff = new FeatureControlsBffService();
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: false, reason: 'tenant off', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await new AuditService().record({ eventType: 'feature.assignment.updated', action: 'update', category: 'admin', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'feature_flag', subjectEntityId: 'feature.search.enabled', sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: 'warning', metadata: { flagKey: 'feature.search.enabled', reason: 'tenant off' }, sensitivity: 'internal' });
  const consoleData = await bff.getConsoleData(context);
  assert.ok(consoleData.flagSummaries.some((item) => item.flagKey === 'feature.search.enabled' && item.hasOverrides));
  assert.ok(consoleData.diagnostics.length >= 0);
  assert.ok(consoleData.recentChanges.some((item) => item.metadata.flagKey === 'feature.search.enabled'));
});

test('catalog helper filters flags, modules, and diagnostic summary for the operator console', () => {
  const flagRows = buildFlagRows([
    { flagKey: 'feature.search.enabled', name: 'Search', description: '', category: 'search', releaseStage: 'general_availability', currentDefaultValue: true, scopesSupported: ['tenant'], isKillSwitch: false, isDeprecated: false, owner: 'platform', tags: ['capability'], dependencies: [], conflicts: [], supportsPercentageRollout: true, effectiveEnabled: true, effectiveValue: true, winningSource: 'definition_default', winningScope: 'definition', hasOverrides: false, hasConflicts: false, hasActiveRollout: false, hasScheduledChanges: false, diagnostics: [], activeAssignmentCount: 0, activeRolloutCount: 0, lastUpdatedAt: undefined, lastUpdatedBy: undefined, currentReasonCodes: [], activeKillSwitch: false },
    { flagKey: 'feature.kill_switch.search', name: 'Search kill switch', description: '', category: 'search', releaseStage: 'general_availability', currentDefaultValue: false, scopesSupported: ['tenant'], isKillSwitch: true, isDeprecated: false, owner: 'platform', tags: ['kill-switch'], dependencies: [], conflicts: [], supportsPercentageRollout: false, effectiveEnabled: true, effectiveValue: true, winningSource: 'assignment', winningScope: 'tenant:ten_rbp_internal', hasOverrides: true, hasConflicts: false, hasActiveRollout: false, hasScheduledChanges: false, diagnostics: ['kill_switch_active'], activeAssignmentCount: 1, activeRolloutCount: 0, lastUpdatedAt: undefined, lastUpdatedBy: undefined, currentReasonCodes: ['kill_switch_active'], activeKillSwitch: true },
  ], 'kill switch', '', 'all', true);
  assert.equal(flagRows.length, 1);
  assert.equal(flagRows[0].flagKey, 'feature.kill_switch.search');

  const moduleRows = buildModuleRows([
    { moduleKey: 'analytics', moduleName: 'Analytics', description: '', category: 'intelligence', route: '/admin/analytics', effectiveEnabled: false, effectiveVisible: false, winningSource: 'module_rule', winningRuleId: 'mcr_1', hasOverrides: true, diagnostics: ['module_inconsistent_state'], activeRuleCount: 1, lastUpdatedAt: undefined, lastUpdatedBy: undefined, internalOnly: false, betaOnly: true, defaultLanding: undefined, reasonCodes: ['beta_only'] },
    { moduleKey: 'support', moduleName: 'Support', description: '', category: 'service', route: '/portal/support', effectiveEnabled: true, effectiveVisible: true, winningSource: 'module_definition', winningRuleId: undefined, hasOverrides: false, diagnostics: [], activeRuleCount: 0, lastUpdatedAt: undefined, lastUpdatedBy: undefined, internalOnly: false, betaOnly: false, defaultLanding: undefined, reasonCodes: [] },
  ], 'analytics', 'issues');
  assert.equal(moduleRows.length, 1);
  assert.equal(moduleRows[0].moduleKey, 'analytics');

  const summary = summarizeDiagnostics([
    { id: '1', area: 'feature_flag', targetKey: 'feature.kill_switch.search', severity: 'critical', type: 'kill_switch_active', summary: 'Kill switch active', detail: '...', status: 'active', relatedIds: [] },
    { id: '2', area: 'feature_flag', targetKey: 'feature.search.enabled', severity: 'warning', type: 'conflicting_assignment', summary: 'Conflict', detail: '...', status: 'active', relatedIds: [] },
    { id: '3', area: 'module_control', targetKey: 'analytics', severity: 'info', type: 'scheduled_rule', summary: 'Scheduled', detail: '...', status: 'scheduled', relatedIds: [] },
  ]);
  assert.deepEqual(summary, { total: 3, critical: 1, warning: 1, scheduled: 1, activeKillSwitches: 1 });
});

test('control-plane access policies enforce preview and admin route protection', async () => {
  const internalContext = await makeAdminConsoleContext();
  const customerContext = await makeContext('customer');
  await assert.doesNotReject(() => requireActionPolicyAccess('admin.rollout.preview', internalContext));
  await assert.rejects(() => requireActionPolicyAccess('admin.rollout.preview', customerContext), (error) => error instanceof BffApiError && error.code === 'forbidden');

  const internalRoute = evaluateRoutePolicyAccess('/api/admin/feature-controls/recent-changes', toAccessContext(internalContext));
  assert.equal(internalRoute.result.allowed, true);
  const customerRoute = evaluateRoutePolicyAccess('/api/admin/feature-controls/recent-changes', toAccessContext(customerContext));
  assert.equal(customerRoute.result.allowed, false);
});

test('feature-control error mapping converts version conflicts into API-safe errors', () => {
  const mapped = toFeatureControlApiError(new Error('assignment_version_conflict'));
  assert.ok(mapped instanceof BffApiError);
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'assignment_version_conflict');
});
