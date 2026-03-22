require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');

const { getIntegrationEnv } = require('../../../../.tmp-platform-tests/integrations/config');
const { PlatformHttpClient } = require('../../../../.tmp-platform-tests/integrations/http');
const { AuthenticationError, UpstreamRateLimitError, UpstreamTimeoutError } = require('../../../../.tmp-platform-tests/integrations/errors');
const { OdooPlatformAdapter } = require('../../../../.tmp-platform-tests/adapters/odoo/odoo-adapter');
const { LendingPlatformAdapter } = require('../../../../.tmp-platform-tests/adapters/lending/lending-adapter');
const { MarblePlatformAdapter } = require('../../../../.tmp-platform-tests/adapters/marble/marble-adapter');
const { N8nPlatformAdapter } = require('../../../../.tmp-platform-tests/adapters/n8n/n8n-adapter');
const { createPlatformAdapters } = require('../../../../.tmp-platform-tests/adapters/factory');

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('integration env defaults adapters to mock mode when base URLs are absent', () => {
  const original = { ...process.env };
  delete process.env.ODOO_BASE_URL;
  delete process.env.LENDING_BASE_URL;
  delete process.env.MARBLE_BASE_URL;
  delete process.env.N8N_BASE_URL;
  const env = getIntegrationEnv();
  assert.equal(env.odoo.mode, 'mock');
  assert.equal(env.lending.mode, 'mock');
  assert.equal(env.marble.mode, 'mock');
  assert.equal(env.n8n.mode, 'mock');
  process.env = original;
});

test('http client retries safe reads and preserves correlation metadata', async () => {
  let attempts = 0;
  const client = new PlatformHttpClient({
    sourceSystem: 'test-system',
    baseUrl: 'https://example.test',
    timeoutMs: 100,
    retryCount: 2,
    fetchImpl: async (url, init) => {
      attempts += 1;
      assert.equal(init.headers['x-correlation-id'], 'corr-1');
      if (attempts === 1) {
        return jsonResponse({ error: 'busy' }, { status: 429 });
      }
      return jsonResponse({ ok: true });
    },
  });

  const result = await client.requestJson({
    path: '/customers',
    operation: 'customers.list',
    headers: { 'x-correlation-id': 'corr-1' },
    correlationId: 'corr-1',
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(attempts, 2);
});

test('http client maps auth and timeout failures into canonical errors', async () => {
  const authClient = new PlatformHttpClient({
    sourceSystem: 'auth-test',
    baseUrl: 'https://example.test',
    timeoutMs: 100,
    retryCount: 0,
    fetchImpl: async () => jsonResponse({ error: 'nope' }, { status: 401 }),
  });
  await assert.rejects(
    authClient.requestJson({ path: '/secure', operation: 'secure.read' }),
    AuthenticationError,
  );

  const timeoutClient = new PlatformHttpClient({
    sourceSystem: 'timeout-test',
    baseUrl: 'https://example.test',
    timeoutMs: 1,
    retryCount: 0,
    fetchImpl: async (_url, init) => {
      await new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        setTimeout(resolve, 20);
      });
      return jsonResponse({ ok: true });
    },
  });
  await assert.rejects(
    timeoutClient.requestJson({ path: '/slow', operation: 'slow.read' }),
    UpstreamTimeoutError,
  );
});

test('odoo adapter normalizes customers, invoices, tickets, and company context', async () => {
  const fetchImpl = async (url, init) => {
    assert.ok(init.headers.Authorization);
    switch (url.pathname) {
      case '/api/customers':
        return jsonResponse([{ id: 10, name: 'Acme Ltd', email: 'ops@acme.test', company_name: 'Acme Ltd', active: true }]);
      case '/api/invoices':
        return jsonResponse([{ id: 88, name: 'INV-88', partner_id: [10, 'Acme Ltd'], currency_id: [1, 'USD'], amount_total: 1000, amount_residual: 250, state: 'posted' }]);
      case '/api/support/tickets':
        return jsonResponse([{ id: 51, ticket_ref: 'SUP-51', name: 'Need help', stage_name: 'open' }]);
      case '/api/company':
        return jsonResponse({ id: 1, name: 'RBP', currency: 'USD', country: 'US' });
      default:
        return jsonResponse({ id: 10, name: 'Acme Ltd', active: true });
    }
  };

  const adapter = new OdooPlatformAdapter({ mode: 'live', enabled: true, baseUrl: 'https://odoo.test', username: 'user', password: 'pass', timeoutMs: 100, retryCount: 1, debugLogging: false }, fetchImpl);
  const customers = await adapter.findCustomers({ search: 'Acme' }, { correlationId: 'odoo-1' });
  const invoices = await adapter.listInvoices({}, { correlationId: 'odoo-2' });
  const tickets = await adapter.listSupportTickets({}, { correlationId: 'odoo-3' });
  const company = await adapter.getCompanyContext({ correlationId: 'odoo-4' });

  assert.equal(customers.data[0].displayName, 'Acme Ltd');
  assert.equal(customers.data[0].sourceRef.sourceSystem, 'odoo');
  assert.equal(invoices.data[0].amountDue, 250);
  assert.equal(tickets.data[0].ticketNumber, 'SUP-51');
  assert.equal(company.data.companyName, 'RBP');
});

test('lending adapter maps applications, loans, borrowers, requirements, and documents', async () => {
  const fetchImpl = async (url) => {
    if (url.pathname === '/api/applications') return jsonResponse([{ id: 'app-1', applicant_name: 'Jane Doe', status: 'submitted', requested_amount: 3000, currency: 'USD' }]);
    if (url.pathname === '/api/loans') return jsonResponse([{ id: 'loan-1', borrower_name: 'Jane Doe', status: 'active', outstanding_amount: 2000 }]);
    if (url.pathname === '/api/borrowers') return jsonResponse([{ id: 'bor-1', full_name: 'Jane Doe', status: 'active' }]);
    if (url.pathname.endsWith('/requirements')) return jsonResponse([{ id: 'req-1', label: 'ID Document', status: 'pending', required: true }]);
    if (url.pathname.endsWith('/documents')) return jsonResponse([{ id: 'doc-1', file_name: 'id.pdf', status: 'received' }]);
    return jsonResponse({ id: 'app-1', applicant_name: 'Jane Doe', status: 'submitted' });
  };

  const adapter = new LendingPlatformAdapter({ mode: 'live', enabled: true, baseUrl: 'https://lending.test', apiKey: 'key', apiSecret: 'secret', timeoutMs: 100, retryCount: 1, debugLogging: false }, fetchImpl);
  const apps = await adapter.listApplications({}, { correlationId: 'lend-1' });
  const loans = await adapter.listLoans({}, { correlationId: 'lend-2' });
  const borrowers = await adapter.findBorrowers({}, { correlationId: 'lend-3' });
  const requirements = await adapter.listApplicationRequirements('app-1', { correlationId: 'lend-4' });
  const documents = await adapter.listApplicationDocuments('app-1', { correlationId: 'lend-5' });

  assert.equal(apps.data[0].applicantName, 'Jane Doe');
  assert.equal(loans.data[0].outstandingAmount, 2000);
  assert.equal(borrowers.data[0].sourceRef.sourceSystem, 'lending');
  assert.equal(requirements.data[0].required, true);
  assert.equal(documents.data[0].name, 'id.pdf');
});

test('marble adapter maps decision, case, and risk responses', async () => {
  const fetchImpl = async (url, init) => {
    if (url.pathname === '/api/decisions') return jsonResponse([{ id: 'dec-1', subject_id: 'cust-1', outcome: 'review', reason_codes: ['pep_match'] }]);
    if (url.pathname === '/api/cases') return jsonResponse([{ id: 'case-1', subject_id: 'cust-1', status: 'open' }]);
    if (url.pathname.endsWith('/risk')) return jsonResponse({ subject_id: 'cust-1', risk_level: 'medium', latest_decision_id: 'dec-1', flags: ['pep_match'] });
    if (url.pathname === '/api/evaluations' && init.method === 'POST') return jsonResponse({ id: 'dec-2', subject_id: 'cust-1', outcome: 'approved', reason_codes: [] });
    if (url.pathname.startsWith('/api/cases/')) return jsonResponse({ id: 'case-1', subject_id: 'cust-1', status: 'open', assignee: 'Analyst' });
    return jsonResponse({ id: 'dec-1', subject_id: 'cust-1', outcome: 'review', reason_codes: ['pep_match'], case_id: 'case-1' });
  };

  const adapter = new MarblePlatformAdapter({ mode: 'live', enabled: true, baseUrl: 'https://marble.test', apiKey: 'marble-key', timeoutMs: 100, retryCount: 1, debugLogging: false }, fetchImpl);
  const decisions = await adapter.listDecisions({}, { correlationId: 'mar-1' });
  const decision = await adapter.evaluateSubject({ subjectId: 'cust-1' }, { correlationId: 'mar-2' });
  const cases = await adapter.listCases({}, { correlationId: 'mar-3' });
  const risk = await adapter.getRiskSummaryForSubject({ subjectId: 'cust-1' }, { correlationId: 'mar-4' });

  assert.equal(decisions.data[0].reasonCodes[0], 'pep_match');
  assert.equal(decision.data.outcome, 'approved');
  assert.equal(cases.data[0].status, 'open');
  assert.equal(risk.data.riskLevel, 'medium');
});

test('n8n adapter maps workflow triggers and execution status', async () => {
  const fetchImpl = async (url, init) => {
    if (url.pathname.endsWith('/trigger')) return jsonResponse({ accepted: true, execution_id: 'exec-1', status: 'running' });
    if (url.pathname === '/api/executions') return jsonResponse([{ id: 'exec-1', workflow_id: 'wf-1', workflow_name: 'sync', status: 'success' }]);
    if (url.pathname === '/api/workflows') return jsonResponse([{ id: 'wf-1', name: 'sync', active: true }]);
    return jsonResponse({ id: 'exec-1', workflow_id: 'wf-1', workflow_name: 'sync', status: 'success', result_summary: 'done' });
  };

  const adapter = new N8nPlatformAdapter({ mode: 'live', enabled: true, baseUrl: 'https://n8n.test', apiKey: 'n8n-key', timeoutMs: 100, retryCount: 1, debugLogging: false }, fetchImpl);
  const triggered = await adapter.triggerWorkflow('wf-1', { recordId: '123' }, { correlationId: 'n8n-1' });
  const executions = await adapter.listWorkflowExecutions({}, { correlationId: 'n8n-2' });
  const status = await adapter.getWorkflowStatus({ workflowId: 'wf-1' }, { correlationId: 'n8n-3' });
  const workflows = await adapter.listAvailableWorkflows({ correlationId: 'n8n-4' });

  assert.equal(triggered.data.executionId, 'exec-1');
  assert.equal(executions.data[0].workflowName, 'sync');
  assert.equal(status.data.status, 'success');
  assert.equal(workflows.data[0].active, true);
});

test('factory returns mock adapters when configured for local development', async () => {
  const adapters = createPlatformAdapters({
    defaultTimeoutMs: 100,
    defaultRetryCount: 1,
    debugLogging: false,
    odoo: { enabled: true, mode: 'mock', timeoutMs: 100, retryCount: 1, debugLogging: false },
    lending: { enabled: true, mode: 'mock', timeoutMs: 100, retryCount: 1, debugLogging: false },
    marble: { enabled: true, mode: 'mock', timeoutMs: 100, retryCount: 1, debugLogging: false },
    n8n: { enabled: true, mode: 'mock', timeoutMs: 100, retryCount: 1, debugLogging: false },
  });

  const customer = await adapters.odoo.getCustomerById('1');
  const app = await adapters.lending.getApplicationById('app-1');
  const risk = await adapters.marble.getRiskSummaryForSubject({ subjectId: 'cust-1' });
  const execution = await adapters.n8n.getWorkflowExecutionById('exec-1');

  assert.equal(customer.meta.source.mode, 'mock');
  assert.equal(app.meta.source.mode, 'mock');
  assert.equal(risk.meta.source.mode, 'mock');
  assert.equal(execution.meta.source.mode, 'mock');
});
