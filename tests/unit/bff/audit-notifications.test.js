const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');
const { AuditService } = require('../../../src/lib/audit/service');
const { resetAuditStoreForTests, getAuditStore } = require('../../../src/lib/audit/store');
const { NotificationService } = require('../../../src/lib/notifications-center/service');
const { resetNotificationStoreForTests, getNotificationStore } = require('../../../src/lib/notifications-center/store');
const { ApplicationSubmissionWorkflowService } = require('../../../src/lib/workflows/services/application-submission-workflow-service');
const { WorkflowStatusQueryService } = require('../../../src/lib/workflows/services/status-query-service');
const { resetWorkflowStoreForTests, getWorkflowStore } = require('../../../src/lib/workflows/store/workflow-store');
const { AuditQueryService } = require('../../../src/lib/audit/query-service');

async function makeContext(kind = 'internal_ops') {
  const principal = resolvePrincipalFromBootstrap({ email: kind === 'customer' ? 'member@rbp.local' : 'admin@rbp.local' });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'customer' ? 'ten_acme_customer' : 'ten_rbp_internal', activeWorkspaceId: kind === 'customer' ? 'wrk_acme_service' : kind === 'internal_admin' ? 'wrk_internal_admin' : 'wrk_internal_ops' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'audit-test-correlation', session, internalUser: kind !== 'customer' };
}

test.beforeEach(async () => {
  process.env.RBP_AUDIT_STORE_PATH = `${process.cwd()}/.rbp-data/test-audit-store.json`;
  process.env.RBP_NOTIFICATION_STORE_PATH = `${process.cwd()}/.rbp-data/test-notification-store.json`;
  process.env.RBP_WORKFLOW_STORE_PATH = `${process.cwd()}/.rbp-data/test-workflow-store.json`;
  resetAuditStoreForTests();
  resetNotificationStoreForTests();
  resetWorkflowStoreForTests();
  await getAuditStore().reset();
  await getNotificationStore().reset();
  await getWorkflowStore().reset();
});

test('audit service records immutable audit events and supports querying', async () => {
  const audit = new AuditService();
  const recorded = await audit.record({ eventType: 'auth.login.succeeded', action: 'login', category: 'authentication', tenantId: 'ten_rbp_internal', actorType: 'user', actorId: 'usr_jane_admin', relatedEntityRefs: [], sourceSystem: 'platform', correlationId: 'corr-1', outcome: 'success', severity: 'info', metadata: { token: 'secret', keep: 'ok' }, sensitivity: 'internal' });
  const fetched = await audit.getById(recorded.id);
  assert.equal(fetched.metadata.token, '[redacted]');
  const list = await audit.query({ tenantId: 'ten_rbp_internal', eventType: 'auth.login.succeeded', limit: 10 });
  assert.equal(list.items.length, 1);
});

test('notification service creates, deduplicates, and updates read state', async () => {
  const notifications = new NotificationService();
  const created = await notifications.create({ tenantId: 'ten_rbp_internal', recipientType: 'user', recipientId: 'usr_jane_admin', notificationType: 'approval.requested', category: 'workflow', title: 'Approval requested', body: 'Please review', severity: 'warning', sourceSystem: 'platform', sourceEventType: 'approval.started', actions: [], channels: ['in_app'], metadata: { correlationId: 'corr-1' }, sourceRefs: [], dedupeKey: 'approval:1' });
  const duplicate = await notifications.create({ tenantId: 'ten_rbp_internal', recipientType: 'user', recipientId: 'usr_jane_admin', notificationType: 'approval.requested', category: 'workflow', title: 'Approval requested', body: 'Please review', severity: 'warning', sourceSystem: 'platform', sourceEventType: 'approval.started', actions: [], channels: ['in_app'], metadata: { correlationId: 'corr-1' }, sourceRefs: [], dedupeKey: 'approval:1' });
  assert.equal(created[0].id, duplicate[0].id);
  const list = await notifications.listForUser({ tenantId: 'ten_rbp_internal', recipientId: 'usr_jane_admin', limit: 10 });
  assert.equal(list.summary.unread, 1);
  await notifications.markRead(created[0].id, { tenantId: 'ten_rbp_internal', userId: 'usr_jane_admin', correlationId: 'corr-2' });
  const updated = await notifications.listForUser({ tenantId: 'ten_rbp_internal', recipientId: 'usr_jane_admin', limit: 10 });
  assert.equal(updated.summary.unread, 0);
});

test('notification preferences can be read and updated', async () => {
  const notifications = new NotificationService();
  const prefs = await notifications.getPreferences('usr_jane_admin', 'ten_rbp_internal');
  assert.equal(prefs[0].channelPreferences.in_app, true);
  const updated = await notifications.updatePreferences('usr_jane_admin', 'ten_rbp_internal', { channelPreferences: { email: true }, muted: false });
  assert.equal(updated.channelPreferences.email, true);
});

test('workflow integration creates audit records and notifications', async () => {
  const workflow = new ApplicationSubmissionWorkflowService();
  const context = await makeContext();
  const result = await workflow.submit(context, { applicationId: 'app-1', idempotencyKey: 'audit-workflow-1' });
  const audit = await new AuditService().query({ tenantId: 'ten_rbp_internal', category: 'workflow', limit: 100 });
  assert.ok(audit.items.some((item) => item.eventType === 'workflow.started'));
  const notifications = await new NotificationService().listForUser({ tenantId: 'ten_rbp_internal', recipientId: 'usr_jane_admin', limit: 50 });
  assert.ok(notifications.items.length >= 1);
  const status = await new WorkflowStatusQueryService().getWorkflowStatus(context, result.workflowInstanceId);
  assert.ok(status.events.length >= 1);
});

test('audit query access is restricted to internal admin users', async () => {
  const audit = new AuditService();
  await audit.record({ eventType: 'tenant.switched', action: 'switch_tenant', category: 'tenancy', tenantId: 'ten_rbp_internal', actorType: 'user', actorId: 'usr_jane_admin', relatedEntityRefs: [], sourceSystem: 'platform', correlationId: 'corr-3', outcome: 'success', severity: 'info', metadata: {}, sensitivity: 'internal' });
  const queryService = new AuditQueryService();
  const adminContext = await makeContext();
  const adminResult = await queryService.query(adminContext, { limit: 10 });
  assert.equal(adminResult.items.length, 1);
  const customerContext = await makeContext('customer');
  await assert.rejects(() => queryService.query(customerContext, { limit: 10 }), (error) => error && error.code === 'audit_forbidden');
});
