const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');
const adaptersFactory = require('../../../src/lib/platform/adapters/factory');
const { SearchService } = require('../../../src/lib/search/service');
const { TaskService } = require('../../../src/lib/tasks/service');
const { getTaskStore, resetTaskStoreForTests } = require('../../../src/lib/tasks/store');
const { getWorkflowStore, resetWorkflowStoreForTests } = require('../../../src/lib/workflows/store/workflow-store');
const { getAuditStore, resetAuditStoreForTests } = require('../../../src/lib/audit/store');
const { getNotificationStore, resetNotificationStoreForTests } = require('../../../src/lib/notifications-center/store');
const { ReviewApprovalWorkflowService } = require('../../../src/lib/workflows/services/review-approval-workflow-service');
const { WorkflowTaskNotificationHooks } = require('../../../src/lib/workflows/services/task-notification-hooks');
const { validateAccessDefinitions, assertAccessDefinitions } = require('../../../src/lib/access/validation');

async function makeContext(kind = 'internal') {
  const principal = resolvePrincipalFromBootstrap({ email: kind === 'customer' ? 'member@rbp.local' : 'admin@rbp.local' });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'customer' ? 'ten_acme_customer' : 'ten_rbp_internal', activeWorkspaceId: kind === 'customer' ? 'wrk_acme_service' : 'wrk_internal_ops' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'search-task-correlation', session, internalUser: kind !== 'customer' };
}

test('access definition registry validates successfully', () => {
  assert.equal(validateAccessDefinitions().valid, true);
  assert.doesNotThrow(() => assertAccessDefinitions());
});

test.beforeEach(async () => {
  process.env.RBP_TASK_STORE_PATH = `${process.cwd()}/.rbp-data/test-task-store.json`;
  process.env.RBP_WORKFLOW_STORE_PATH = `${process.cwd()}/.rbp-data/test-workflow-store.json`;
  process.env.RBP_AUDIT_STORE_PATH = `${process.cwd()}/.rbp-data/test-audit-store.json`;
  process.env.RBP_NOTIFICATION_STORE_PATH = `${process.cwd()}/.rbp-data/test-notification-store.json`;
  resetTaskStoreForTests();
  resetWorkflowStoreForTests();
  resetAuditStoreForTests();
  resetNotificationStoreForTests();
  adaptersFactory.resetPlatformAdaptersForTests();
  await getTaskStore().reset();
  await getWorkflowStore().reset();
  await getAuditStore().reset();
  await getNotificationStore().reset();
});

test('search aggregates results across providers and ranks exact hits first', { concurrency: false }, async () => {
  const service = new SearchService();
  const context = await makeContext();
  const params = new URLSearchParams({ q: 'app-1', includeSuggestions: 'true', pageSize: '10' });
  const result = await service.search(context, params);
  assert.ok(result.items.some((item) => item.entityType === 'application'));
  assert.equal(result.items[0].entityId, 'app-1');
  assert.ok(Array.isArray(result.suggestions));
});

test('search enforces internal-only domains for customer users', { concurrency: false }, async () => {
  const service = new SearchService();
  const context = await makeContext('customer');
  const result = await service.search(context, new URLSearchParams({ q: 'inv-1' }));
  assert.ok(result.items.every((item) => !['invoice', 'loan', 'application', 'case', 'workflow'].includes(item.entityType)));
});

test('search degrades gracefully when one provider fails', { concurrency: false }, async (t) => {
  const adapters = adaptersFactory.createPlatformAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({ ...adapters, odoo: { ...adapters.odoo, findCustomers: async () => { throw new Error('odoo down'); } } }));
  adaptersFactory.resetPlatformAdaptersForTests();
  const service = new SearchService();
  const result = await service.search(await makeContext(), new URLSearchParams({ q: 'Jane', includeSuggestions: 'true' }));
  assert.ok(result.warnings.some((warning) => warning.code === 'odoo_search_unavailable'));
  assert.ok(result.items.length >= 1);
});

test('task aggregation combines workflow, internal, lending, marble, and odoo work', { concurrency: false }, async () => {
  const hooks = new WorkflowTaskNotificationHooks();
  await hooks.createTask({ workflowInstanceId: 'wf_internal_1', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', title: 'Manual review', queue: 'credit_review', relatedEntityType: 'application', relatedEntityId: 'app-1', correlationId: 'task-corr' });
  const review = new ReviewApprovalWorkflowService();
  await review.start(await makeContext(), { relatedEntityType: 'application', relatedEntityId: 'app-1', reviewType: 'credit_approval', idempotencyKey: 'review-step-8' });
  const service = new TaskService();
  const result = await service.listTasks(await makeContext(), { assignment: 'all', pageSize: 50 });
  assert.ok(result.items.some((item) => item.sourceSystem === 'platform'));
  assert.ok(result.items.some((item) => item.id.startsWith('workflow:')));
  assert.ok(result.items.some((item) => item.sourceSystem === 'lending'));
  assert.ok(result.items.some((item) => item.sourceSystem === 'marble'));
  assert.ok(result.items.some((item) => item.sourceSystem === 'odoo'));
  assert.ok(result.summary.totalOpen >= 4);
});

test('task assign action updates stored task and emits notification plus audit', { concurrency: false }, async () => {
  const hooks = new WorkflowTaskNotificationHooks();
  const created = await hooks.createTask({ workflowInstanceId: 'wf_assign_1', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', title: 'Assign me', queue: 'credit_review', relatedEntityType: 'application', relatedEntityId: 'app-1', correlationId: 'task-corr' });
  const service = new TaskService();
  const context = await makeContext();
  const result = await service.performAction(context, created.id, 'assign', { assigneeId: context.session.user.id });
  assert.equal(result.success, true);
  assert.equal(result.task.assigneeId, context.session.user.id);
  const notifications = await getNotificationStore().listNotifications();
  assert.ok(notifications.some((item) => item.notificationType === 'task.assigned'));
  const audit = await getAuditStore().query();
  assert.ok(audit.some((item) => item.eventType === 'task.assign'));
});

test('workflow review task action routes through approval workflow', { concurrency: false }, async () => {
  const review = new ReviewApprovalWorkflowService();
  const context = await makeContext();
  const started = await review.start(context, { relatedEntityType: 'application', relatedEntityId: 'app-1', reviewType: 'credit_approval', idempotencyKey: 'review-action-1' });
  const service = new TaskService();
  const list = await service.listTasks(context, { assignment: 'all', pageSize: 20 });
  const workflowTask = list.items.find((item) => item.id === `workflow:${started.workflowInstanceId}`);
  assert.ok(workflowTask);
  const result = await service.performAction(context, workflowTask.id, 'approve', { comment: 'Approved in task inbox' });
  assert.equal(result.success, true);
  assert.equal(result.meta.workflowStatus, 'completed');
});

test('customer users cannot view internal workflow status or perform high-risk task actions', { concurrency: false }, async () => {
  const review = new ReviewApprovalWorkflowService();
  const internalContext = await makeContext();
  const started = await review.start(internalContext, { relatedEntityType: 'application', relatedEntityId: 'app-1', reviewType: 'credit_approval', idempotencyKey: 'review-protected-1' });
  const service = new TaskService();
  const customerContext = await makeContext('customer');
  const list = await service.listTasks(internalContext, { assignment: 'all', pageSize: 20 });
  const workflowTask = list.items.find((item) => item.id === `workflow:${started.workflowInstanceId}`);
  assert.ok(workflowTask);
  await assert.rejects(() => service.performAction(customerContext, workflowTask.id, 'approve', { comment: 'nope' }), /Action access denied|workflow_permission_denied/);
});
