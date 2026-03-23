const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node/register/transpile-only');
require('../../../scripts/register-alias.cjs');

const { createPersistedSession, buildPlatformSession } = require('../../../src/lib/platform/session');
const { resolvePrincipalFromBootstrap } = require('../../../src/lib/platform/bootstrap');
const adaptersFactory = require('../../../src/lib/platform/adapters/factory');
const { resetWorkflowStoreForTests, getWorkflowStore } = require('../../../src/lib/workflows/store/workflow-store');
const { ApplicationSubmissionWorkflowService } = require('../../../src/lib/workflows/services/application-submission-workflow-service');
const { DocumentUploadWorkflowService } = require('../../../src/lib/workflows/services/document-upload-workflow-service');
const { SupportEscalationWorkflowService } = require('../../../src/lib/workflows/services/support-escalation-workflow-service');
const { BillingEventWorkflowService } = require('../../../src/lib/workflows/services/billing-event-workflow-service');
const { ReviewApprovalWorkflowService } = require('../../../src/lib/workflows/services/review-approval-workflow-service');
const { WorkflowStatusQueryService } = require('../../../src/lib/workflows/services/status-query-service');
const { WorkflowError } = require('../../../src/lib/workflows/utils/errors');

async function makeContext(kind = 'internal_ops') {
  const email = kind === 'customer' ? 'member@rbp.local' : 'admin@rbp.local';
  const principal = resolvePrincipalFromBootstrap({ email });
  const persisted = createPersistedSession({ principal, auth: { provider: 'local' }, activeTenantId: kind === 'customer' ? 'ten_acme_customer' : 'ten_rbp_internal', activeWorkspaceId: kind === 'customer' ? 'wrk_acme_service' : kind === 'internal_admin' ? 'wrk_internal_admin' : 'wrk_internal_ops' });
  const session = await buildPlatformSession(persisted);
  return { correlationId: 'wf-test-correlation', session, internalUser: kind !== 'customer' };
}

test.beforeEach(async () => {
  process.env.RBP_WORKFLOW_STORE_PATH = `${process.cwd()}/.rbp-data/test-workflow-store.json`;
  resetWorkflowStoreForTests();
  await getWorkflowStore().reset();
});

test('application submission workflow creates steps and supports idempotency', async () => {
  const service = new ApplicationSubmissionWorkflowService();
  const context = await makeContext();
  const first = await service.submit(context, { applicationId: 'app-1', idempotencyKey: 'app-submit-1' });
  const second = await service.submit(context, { applicationId: 'app-1', idempotencyKey: 'app-submit-1' });
  assert.equal(first.workflowInstanceId, second.workflowInstanceId);
  const status = await new WorkflowStatusQueryService().getWorkflowStatus(context, first.workflowInstanceId);
  assert.ok(status.steps.length >= 4);
});

test('application submission handles risk evaluation partial failure', async (t) => {
  const adapters = adaptersFactory.createPlatformAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({ ...adapters, marble: { ...adapters.marble, evaluateSubject: async () => { throw new Error('risk down'); } } }));
  const service = new ApplicationSubmissionWorkflowService();
  const result = await service.submit(await makeContext(), { applicationId: 'app-1', idempotencyKey: 'app-submit-partial' });
  assert.equal(result.status, 'partially_completed');
  assert.ok(result.warnings.some((item) => item.code === 'risk_evaluation_failed'));
});

test('application submission rejects invalid state', async (t) => {
  const adapters = adaptersFactory.createPlatformAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({ ...adapters, lending: { ...adapters.lending, getApplicationById: async () => ({ data: { id: 'app-1', applicantName: 'Jane Doe', status: 'approved', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: 'app-1', syncedAt: new Date().toISOString() } }, meta: { correlationId: 'x', source: adapters.lending.getSourceInfo(), receivedAt: new Date().toISOString() } }) } }));
  const service = new ApplicationSubmissionWorkflowService();
  const context = await makeContext();
  await assert.rejects(() => service.submit(context, { applicationId: 'app-1' }), (error) => error instanceof WorkflowError && error.code === 'application_not_submittable');
});

test('document upload validates target and records waiting state', async () => {
  const service = new DocumentUploadWorkflowService();
  const result = await service.registerUpload(await makeContext(), { ownerEntityType: 'application', ownerEntityId: 'app-1', documentType: 'bank_statement', storageReference: 's3://bucket/doc.pdf', fileName: 'doc.pdf', idempotencyKey: 'doc-1' });
  assert.equal(result.status, 'waiting_internal');
  const status = await new WorkflowStatusQueryService().getWorkflowStatus(await makeContext(), result.workflowInstanceId);
  assert.equal(status.workflow.status, 'waiting_internal');
});

test('document upload rejects invalid target', async (t) => {
  const adapters = adaptersFactory.createPlatformAdapters();
  t.mock.method(adaptersFactory, 'getPlatformAdapters', () => ({ ...adapters, lending: { ...adapters.lending, getApplicationById: async () => { throw new Error('missing'); } } }));
  const service = new DocumentUploadWorkflowService();
  const context = await makeContext();
  await assert.rejects(() => service.registerUpload(context, { ownerEntityType: 'application', ownerEntityId: 'missing', documentType: 'id', storageReference: 'x', fileName: 'x' }), (error) => error instanceof WorkflowError && error.code === 'document_target_not_found');
});

test('support escalation creates escalation workflow and task', async () => {
  const service = new SupportEscalationWorkflowService();
  const result = await service.escalate(await makeContext(), { ticketId: 'ticket-1', escalationReason: 'Customer blocked', severity: 'high', targetQueue: 'ops-escalations', idempotencyKey: 'esc-1' });
  assert.ok(['waiting_internal', 'partially_completed'].includes(result.status));
});

test('billing event suppresses duplicate processing', async () => {
  const service = new BillingEventWorkflowService();
  const financeContext = await makeContext('internal_admin');
  const a = await service.process(financeContext, { eventType: 'invoice_overdue', relatedEntityType: 'invoice', relatedEntityId: 'inv-1', eventPayload: { amountDue: 100 }, idempotencyKey: 'bill-1' });
  const b = await service.process(financeContext, { eventType: 'invoice_overdue', relatedEntityType: 'invoice', relatedEntityId: 'inv-1', eventPayload: { amountDue: 100 }, idempotencyKey: 'bill-1' });
  assert.equal(a.workflowInstanceId, b.workflowInstanceId);
});

test('billing event rejects unsupported type', async () => {
  const service = new BillingEventWorkflowService();
  const context = await makeContext('internal_admin');
  await assert.rejects(() => service.process(context, { eventType: 'refund_started', relatedEntityType: 'invoice', relatedEntityId: 'inv-1', eventPayload: {} }), (error) => error instanceof WorkflowError && error.code === 'billing_event_unsupported');
});

test('review approval can start and approve', async () => {
  const service = new ReviewApprovalWorkflowService();
  const started = await service.start(await makeContext(), { relatedEntityType: 'application', relatedEntityId: 'app-1', reviewType: 'credit_approval', idempotencyKey: 'rev-1' });
  const approved = await service.act(await makeContext(), started.workflowInstanceId, { action: 'approve', comment: 'Looks good' });
  assert.equal(approved.status, 'completed');
  const status = await new WorkflowStatusQueryService().getWorkflowStatus(await makeContext(), started.workflowInstanceId);
  assert.equal(status.workflow.status, 'completed');
});

test('review approval rejects invalid transition', async () => {
  const service = new ReviewApprovalWorkflowService();
  const started = await service.start(await makeContext(), { relatedEntityType: 'application', relatedEntityId: 'app-1', reviewType: 'credit_approval' });
  await service.act(await makeContext(), started.workflowInstanceId, { action: 'cancel' });
  const context = await makeContext();
  await assert.rejects(() => service.act(context, started.workflowInstanceId, { action: 'approve' }), (error) => error instanceof WorkflowError && error.code === 'workflow_not_actionable');
});

test('workflow status query enforces tenant scope', async () => {
  const service = new ApplicationSubmissionWorkflowService();
  const result = await service.submit(await makeContext(), { applicationId: 'app-1', idempotencyKey: 'scope-1' });
  const customerContext = await makeContext('customer');
  await assert.rejects(() => new WorkflowStatusQueryService().getWorkflowStatus(customerContext, result.workflowInstanceId), (error) => error instanceof WorkflowError && error.code === 'workflow_forbidden');
});

test('workflow status access is blocked for customer operators before tenant data is returned', async () => {
  const service = new ApplicationSubmissionWorkflowService();
  const result = await service.submit(await makeContext(), { applicationId: 'app-1', idempotencyKey: 'scope-cap-1' });
  const customerContext = await makeContext('customer');
  await assert.rejects(() => new WorkflowStatusQueryService().getWorkflowStatus(customerContext, result.workflowInstanceId), (error) => error instanceof WorkflowError && error.code === 'workflow_permission_denied');
});
