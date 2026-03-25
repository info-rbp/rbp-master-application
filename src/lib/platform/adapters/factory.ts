import { getIntegrationEnv, type PlatformIntegrationEnv } from '../integrations/config';
import type { AdapterResponseEnvelope, AdapterSourceInfo, ApplicationDetail, ApplicationSummary, BorrowerSummary, CaseDetail, CaseSummary, CompanyContext, CustomerDetail, CustomerSummary, DecisionDetail, DecisionSummary, DocumentSummary, InvoiceDetail, InvoiceSummary, KnowledgeItemSummary, LoanDetail, LoanSummary, RequirementSummary, RiskSummary, SupportTicketDetail, SupportTicketSummary, TriggeredWorkflowResponse, WorkflowExecutionDetail, WorkflowExecutionSummary } from '../integrations/types';
import type { AdapterHealth } from '../integrations/health';
import type { AdapterRequestContext } from '../integrations/tracing';
import type { LendingAdapter, MarbleAdapter, N8nAdapter, OdooAdapter, PlatformAdapterRegistry } from './base/types';
import { OdooPlatformAdapter } from './odoo/odoo-adapter';
import { LendingPlatformAdapter } from './lending/lending-adapter';
import { MarblePlatformAdapter } from './marble/marble-adapter';
import { N8nPlatformAdapter } from './n8n/n8n-adapter';
import { getIntegrationRuntimePolicy, type IntegrationAdapterKey } from '../integrations/policy';
import type { IntegrationRuntimePolicy } from '../integrations/types';

const mockNow = () => new Date().toISOString();

abstract class MockAdapterBase {
  constructor(private readonly adapterKey: string, private readonly displayName: string) {}

  getSourceInfo(): AdapterSourceInfo {
    return { adapterKey: this.adapterKey, displayName: this.displayName, mode: 'mock' };
  }

  async getHealth(): Promise<AdapterHealth> {
    return { adapterKey: this.adapterKey, status: 'healthy', checkedAt: mockNow(), authStatus: 'unknown', details: { mode: 'mock' } };
  }

  async getCapabilities() { return []; }

  async getRuntimePolicy(): Promise<IntegrationRuntimePolicy> {
    return getIntegrationRuntimePolicy({ adapterKey: this.adapterKey as IntegrationAdapterKey, overrides: { mode: 'mock', enabled: true } });
  }

  protected envelope<T>(data: T, correlationId = 'mock-correlation'): AdapterResponseEnvelope<T> {
    return { data, meta: { correlationId, source: this.getSourceInfo(), receivedAt: mockNow() } };
  }
}

class MockOdooAdapter extends MockAdapterBase implements OdooAdapter {
  constructor() { super('odoo', 'Odoo'); }
  async findCustomers() { return this.envelope<CustomerSummary[]>([{ id: 'odoo-cust-1', displayName: 'Acme Ltd', email: 'ops@acme.test', status: 'active', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'res.partner', sourceRecordId: '1', syncedAt: mockNow() } }]); }
  async getCustomerById(id: string) { return this.envelope<CustomerDetail>({ id, displayName: 'Acme Ltd', email: 'ops@acme.test', status: 'active', tags: ['mock'], sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'res.partner', sourceRecordId: id, syncedAt: mockNow() } }); }
  async createOrUpdateCustomer(payload: { id?: string; displayName: string }) { return this.envelope<CustomerDetail>({ id: payload.id ?? 'new-customer', displayName: payload.displayName, status: 'active', tags: ['mock'], sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'res.partner', sourceRecordId: payload.id ?? 'new-customer', syncedAt: mockNow() } }); }
  async listInvoices() { return this.envelope<InvoiceSummary[]>([{ id: 'inv-1', invoiceNumber: 'INV-1', currency: 'USD', amountTotal: 500, amountDue: 100, status: 'posted', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'account.move', sourceRecordId: 'inv-1', syncedAt: mockNow() } }]); }
  async getInvoiceById(id: string) { return this.envelope<InvoiceDetail>({ id, invoiceNumber: id, currency: 'USD', amountTotal: 500, amountDue: 100, status: 'posted', lines: [], sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'account.move', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listSupportTickets() { return this.envelope<SupportTicketSummary[]>([{ id: 'ticket-1', ticketNumber: 'T-1', subject: 'Portal issue', status: 'open', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'helpdesk.ticket', sourceRecordId: 'ticket-1', syncedAt: mockNow() } }]); }
  async getSupportTicketById(id: string) { return this.envelope<SupportTicketDetail>({ id, ticketNumber: id, subject: 'Portal issue', status: 'open', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'helpdesk.ticket', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listKnowledgeItems() { return this.envelope<KnowledgeItemSummary[]>([{ id: 'art-1', title: 'How to onboard', status: 'published', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'knowledge.article', sourceRecordId: 'art-1', syncedAt: mockNow() } }]); }
  async getCompanyContext() { return this.envelope<CompanyContext>({ companyId: 'co-1', companyName: 'Remote Business Partner', currency: 'USD', sourceRef: { sourceSystem: 'odoo', sourceRecordType: 'res.company', sourceRecordId: 'co-1', syncedAt: mockNow() } }); }
}

class MockLendingAdapter extends MockAdapterBase implements LendingAdapter {
  constructor() { super('lending', 'Frappe Lending'); }
  async listApplications() { return this.envelope<ApplicationSummary[]>([{ id: 'app-1', applicantName: 'Jane Doe', status: 'submitted', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: 'app-1', syncedAt: mockNow() } }]); }
  async getApplicationById(id: string) { return this.envelope<ApplicationDetail>({ id, applicantName: 'Jane Doe', status: 'submitted', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: id, syncedAt: mockNow() } }); }
  async createApplication(payload: { applicantName: string }) { return this.envelope<ApplicationDetail>({ id: 'app-created', applicantName: payload.applicantName, status: 'submitted', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: 'app-created', syncedAt: mockNow() } }); }
  async updateApplicationStatus(id: string, payload: { status: string }) { return this.envelope<ApplicationDetail>({ id, applicantName: 'Jane Doe', status: payload.status, sourceRef: { sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listLoans() { return this.envelope<LoanSummary[]>([{ id: 'loan-1', borrowerName: 'Jane Doe', status: 'active', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'loan', sourceRecordId: 'loan-1', syncedAt: mockNow() } }]); }
  async getLoanById(id: string) { return this.envelope<LoanDetail>({ id, borrowerName: 'Jane Doe', status: 'active', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'loan', sourceRecordId: id, syncedAt: mockNow() } }); }
  async findBorrowers() { return this.envelope<BorrowerSummary[]>([{ id: 'bor-1', displayName: 'Jane Doe', status: 'active', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'borrower', sourceRecordId: 'bor-1', syncedAt: mockNow() } }]); }
  async getBorrowerById(id: string) { return this.envelope<BorrowerSummary>({ id, displayName: 'Jane Doe', status: 'active', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'borrower', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listApplicationRequirements() { return this.envelope<RequirementSummary[]>([{ id: 'req-1', name: 'Proof of address', status: 'pending', required: true, sourceRef: { sourceSystem: 'lending', sourceRecordType: 'requirement', sourceRecordId: 'req-1', syncedAt: mockNow() } }]); }
  async listApplicationDocuments() { return this.envelope<DocumentSummary[]>([{ id: 'doc-1', name: 'passport.pdf', status: 'received', sourceRef: { sourceSystem: 'lending', sourceRecordType: 'document', sourceRecordId: 'doc-1', syncedAt: mockNow() } }]); }
}

class MockMarbleAdapter extends MockAdapterBase implements MarbleAdapter {
  constructor() { super('marble', 'Marble'); }
  async getDecisionById(id: string) { return this.envelope<DecisionDetail>({ id, outcome: 'approved', reasonCodes: ['low_risk'], sourceRef: { sourceSystem: 'marble', sourceRecordType: 'decision', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listDecisions() { return this.envelope<DecisionSummary[]>([{ id: 'dec-1', outcome: 'review', reasonCodes: ['manual_review'], sourceRef: { sourceSystem: 'marble', sourceRecordType: 'decision', sourceRecordId: 'dec-1', syncedAt: mockNow() } }]); }
  async evaluateSubject(payload: { subjectId: string }) { return this.envelope<DecisionDetail>({ id: 'dec-eval', subjectId: payload.subjectId, outcome: 'approved', reasonCodes: ['mock_ok'], sourceRef: { sourceSystem: 'marble', sourceRecordType: 'decision', sourceRecordId: 'dec-eval', syncedAt: mockNow() } }); }
  async getSubjectDecisionHistory(subjectRef: { subjectId: string }) { return this.envelope<DecisionSummary[]>([{ id: 'dec-history', subjectId: subjectRef.subjectId, outcome: 'approved', reasonCodes: [], sourceRef: { sourceSystem: 'marble', sourceRecordType: 'decision', sourceRecordId: 'dec-history', syncedAt: mockNow() } }]); }
  async listCases() { return this.envelope<CaseSummary[]>([{ id: 'case-1', status: 'open', sourceRef: { sourceSystem: 'marble', sourceRecordType: 'case', sourceRecordId: 'case-1', syncedAt: mockNow() } }]); }
  async getCaseById(id: string) { return this.envelope<CaseDetail>({ id, status: 'open', sourceRef: { sourceSystem: 'marble', sourceRecordType: 'case', sourceRecordId: id, syncedAt: mockNow() } }); }
  async getRiskSummaryForSubject(subjectRef: { subjectId: string }) { return this.envelope<RiskSummary>({ subjectId: subjectRef.subjectId, riskLevel: 'low', flags: [], sourceRef: { sourceSystem: 'marble', sourceRecordType: 'risk-summary', sourceRecordId: subjectRef.subjectId, syncedAt: mockNow() } }); }
}

class MockN8nAdapter extends MockAdapterBase implements N8nAdapter {
  constructor() { super('n8n', 'n8n'); }
  async triggerWorkflow(workflowKeyOrId: string) { return this.envelope<TriggeredWorkflowResponse>({ accepted: true, executionId: 'exec-1', status: 'running', sourceRef: { sourceSystem: 'n8n', sourceRecordType: 'workflow', sourceRecordId: workflowKeyOrId, syncedAt: mockNow() } }); }
  async getWorkflowExecutionById(id: string) { return this.envelope<WorkflowExecutionDetail>({ id, workflowId: 'wf-1', status: 'success', sourceRef: { sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: id, syncedAt: mockNow() } }); }
  async listWorkflowExecutions() { return this.envelope<WorkflowExecutionSummary[]>([{ id: 'exec-1', workflowId: 'wf-1', status: 'success', sourceRef: { sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: 'exec-1', syncedAt: mockNow() } }]); }
  async getWorkflowStatus(reference: { executionId?: string; workflowId?: string }) { return this.envelope<WorkflowExecutionSummary>({ id: reference.executionId ?? 'exec-latest', workflowId: reference.workflowId ?? 'wf-1', status: 'success', sourceRef: { sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: reference.executionId ?? 'exec-latest', syncedAt: mockNow() } }); }
  async listAvailableWorkflows() { return this.envelope([{ id: 'wf-1', name: 'sync-crm', active: true }]); }
}

export function createPlatformAdapters(env: PlatformIntegrationEnv = getIntegrationEnv()): PlatformAdapterRegistry {
  return {
    odoo: env.odoo.mode === 'mock' ? new MockOdooAdapter() : new OdooPlatformAdapter(env.odoo),
    lending: env.lending.mode === 'mock' ? new MockLendingAdapter() : new LendingPlatformAdapter(env.lending),
    marble: env.marble.mode === 'mock' ? new MockMarbleAdapter() : new MarblePlatformAdapter(env.marble),
    n8n: env.n8n.mode === 'mock' ? new MockN8nAdapter() : new N8nPlatformAdapter(env.n8n),
  };
}

let adapterRegistry: PlatformAdapterRegistry | null = null;

export function getPlatformAdapters() {
  adapterRegistry ??= createPlatformAdapters();
  return adapterRegistry;
}

export function getPlatformAdapter<K extends keyof PlatformAdapterRegistry>(key: K): PlatformAdapterRegistry[K] {
  return getPlatformAdapters()[key];
}

export function resetPlatformAdaptersForTests() {
  adapterRegistry = null;
}
