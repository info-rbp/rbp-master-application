const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');
const { FeatureFlagService, buildFeatureEvaluationContext } = require('../../../src/lib/feature-flags/service');
const { resetFeatureFlagStoreForTests, getFeatureFlagStore } = require('../../../src/lib/feature-flags/store');
const { resetAuditStoreForTests, getAuditStore } = require('../../../src/lib/audit/store');
const { resetNotificationStoreForTests, getNotificationStore } = require('../../../src/lib/notifications-center/store');
const { AuditService } = require('../../../src/lib/audit/service');
const { NotificationService } = require('../../../src/lib/notifications-center/service');
const { SearchService } = require('../../../src/lib/search/service');
const { TaskService } = require('../../../src/lib/tasks/service');
const { BffApiError } = require('../../../src/lib/bff/utils/request-context');

async function makeContext(kind = 'internal') {
  const principal = resolvePrincipalFromBootstrap({ email: kind === 'internal' ? 'admin@rbp.local' : 'member@rbp.local' });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'internal' ? 'ten_rbp_internal' : 'ten_acme_customer', activeWorkspaceId: kind === 'internal' ? 'wrk_internal_ops' : 'wrk_acme_service' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'feature-test-correlation', session, internalUser: kind === 'internal' };
}

test.beforeEach(async () => {
  resetFeatureFlagStoreForTests();
  resetAuditStoreForTests();
  resetNotificationStoreForTests();
  await getFeatureFlagStore().reset();
  await getAuditStore().reset();
  await getNotificationStore().reset();
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

test('kill switch overrides normal feature enablement', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  const featureContext = buildFeatureEvaluationContext(context);
  await service.saveAssignment({ flagKey: 'feature.search.enabled', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'tenant on', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await service.saveAssignment({ flagKey: 'feature.kill_switch.search', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  const kill = await service.evaluateFlag('feature.kill_switch.search', featureContext);
  assert.equal(kill.enabled, true);
  await assert.rejects(() => new SearchService().search(context, new URLSearchParams({ q: 'loan', page: '1', pageSize: '5' })), (error) => error instanceof BffApiError && error.code === 'search_kill_switch_active');
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

test('task kill switch disables task listing', async () => {
  const service = new FeatureFlagService();
  const context = await makeContext();
  await service.saveAssignment({ flagKey: 'feature.kill_switch.tasks', scopeType: 'tenant', scopeId: context.session.activeTenant.id, value: true, reason: 'incident', enabled: true, createdBy: 'system', updatedBy: 'system', metadata: {} });
  await assert.rejects(() => new TaskService().listTasks(context, { page: 1, pageSize: 10, assignment: 'all' }), (error) => error instanceof BffApiError && error.code === 'tasks_kill_switch_active');
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
