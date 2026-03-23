const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { DashboardBffService } = require('../../../src/lib/bff/services/dashboard-bff-service');
const { Customer360BffService } = require('../../../src/lib/bff/services/customer-360-bff-service');
const { ApplicationBffService } = require('../../../src/lib/bff/services/application-bff-service');
const { LoanBffService } = require('../../../src/lib/bff/services/loan-bff-service');
const { TaskInboxBffService } = require('../../../src/lib/bff/services/task-inbox-bff-service');
const { NotificationBffService } = require('../../../src/lib/bff/services/notification-bff-service');
const { SessionBffService } = require('../../../src/lib/bff/services/session-bff-service');
const { BffApiError } = require('../../../src/lib/bff/utils/request-context');
const { normalizeStatus } = require('../../../src/lib/bff/utils/status');
const sessionModule = require('../../../src/lib/platform/session');
const adaptersFactory = require('../../../src/lib/platform/adapters/factory');
const { NotificationService } = require('../../../src/lib/notifications-center/service');
const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');

async function makeContext(kind = 'internal') {
  const principal = resolvePrincipalFromBootstrap({ email: kind === 'internal' ? 'admin@rbp.local' : 'member@rbp.local' });
  assert.ok(principal);
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'internal' ? 'ten_rbp_internal' : 'ten_acme_customer', activeWorkspaceId: kind === 'internal' ? 'wrk_internal_ops' : 'wrk_acme_service' });
  const session = await buildPlatformSession(persisted);
  assert.ok(session);
  return { correlationId: 'test-correlation', session, internalUser: kind === 'internal' };
}

function mockAdapters() {
  return adaptersFactory.createPlatformAdapters();
}

test('session service returns canonical unauthenticated shape', async (t) => {
  t.mock.method(sessionModule, 'resolveSessionResponse', async () => ({ authenticated: false }));
  const service = new SessionBffService();
  const data = await service.getSession();
  assert.equal(data.authenticated, false);
  assert.deepEqual(data.enabledModules, []);
});

test('dashboard service aggregates workspace data', async (t) => {
  t.mock.method(NotificationService.prototype, 'listForUser', async () => ({ items: [], summary: { total: 0, unread: 0, highSeverity: 0 }, pagination: { limit: 10, total: 0 } }));
  const service = new DashboardBffService();
  const data = await service.getDashboard(await makeContext());
  assert.equal(data.tenantSummary.tenantId, 'ten_rbp_internal');
  assert.ok(data.metrics.length >= 3);
  assert.ok(Array.isArray(data.recentActivity));
});

test('customer 360 service returns unified workspace data', async () => {
  const service = new Customer360BffService();
  const data = await service.getCustomer360('odoo-cust-1', await makeContext());
  assert.equal(data.customer.id, 'odoo-cust-1');
  assert.ok('applicationsSummary' in data);
  assert.ok('loansSummary' in data);
});

test('application detail service maps lending detail without leaking raw payloads', async () => {
  const service = new ApplicationBffService();
  const data = await service.getApplication('app-1', await makeContext());
  assert.equal(data.application.id, 'app-1');
  assert.equal(typeof data.application.status.label, 'string');
  assert.equal(Object.prototype.hasOwnProperty.call(data.application, 'docstatus'), false);
});

test('loan detail service maps stable workspace contract', async () => {
  const service = new LoanBffService();
  const data = await service.getLoan('loan-1', await makeContext());
  assert.equal(data.loan.id, 'loan-1');
  assert.ok(data.financialSummary.sourceRefs.length >= 1);
});

test('task inbox service normalizes tasks across sources', async () => {
  const service = new TaskInboxBffService();
  const data = await service.listTasks(await makeContext());
  assert.ok(data.items.some((item) => item.sourceSystem === 'lending'));
  assert.ok(data.items.some((item) => item.sourceSystem === 'marble'));
  assert.ok(data.items.some((item) => item.sourceSystem === 'odoo'));
});

test('notification service returns UI-ready notification list', async (t) => {
  t.mock.method(NotificationService.prototype, 'listForUser', async () => ({ items: [{ id: 'n1', notificationType: 'system', category: 'system', title: 'Hello', body: 'World', severity: 'warning', status: 'unread' }], summary: { total: 1, unread: 1, highSeverity: 1 }, pagination: { limit: 50, total: 1 } }));
  const service = new NotificationBffService();
  const data = await service.listNotifications(await makeContext());
  assert.equal(data.summary.unread, 1);
  assert.equal(data.items[0].status, 'unread');
});

test('customer 360 degrades gracefully on optional dependency failure', async (t) => {
  const adapters = mockAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({
    ...adapters,
    marble: { ...adapters.marble, getRiskSummaryForSubject: async () => { throw new Error('boom'); } },
  }));
  const service = new Customer360BffService();
  const data = await service.getCustomer360('odoo-cust-1', await makeContext());
  assert.ok(data.warnings.some((warning) => warning.code === 'compliance_unavailable'));
});

test('loan detail returns not found when the record is inaccessible', async (t) => {
  const adapters = mockAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({
    ...adapters,
    lending: { ...adapters.lending, getLoanById: async () => { throw new Error('missing'); } },
  }));
  const service = new LoanBffService();
  const context = await makeContext();
  await assert.rejects(() => service.getLoan('missing', context), (error) => error instanceof BffApiError && error.status === 404);
});

test('customer workspace is blocked from internal-only module endpoints', async () => {
  const service = new Customer360BffService();
  const context = await makeContext('customer');
  await assert.rejects(() => service.getCustomer360('odoo-cust-1', context), (error) => error instanceof BffApiError && error.code === 'module_disabled');
});

test('status normalization provides canonical labels', () => {
  assert.deepEqual(normalizeStatus('application', 'submitted'), { category: 'pending', code: 'submitted', label: 'Submitted' });
});
