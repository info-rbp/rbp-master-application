import type { AdapterHealth } from '../../integrations/health';
import type {
  AdapterCapability,
  AdapterResponseEnvelope,
  AdapterSourceInfo,
  ApplicationDetail,
  ApplicationSummary,
  BorrowerSummary,
  CaseDetail,
  CaseSummary,
  CompanyContext,
  CustomerDetail,
  CustomerSummary,
  DecisionDetail,
  DecisionSummary,
  DocumentSummary,
  InvoiceDetail,
  InvoiceSummary,
  KnowledgeItemSummary,
  LoanDetail,
  LoanSummary,
  PlatformAdapter,
  RequirementSummary,
  RiskSummary,
  SupportTicketDetail,
  SupportTicketSummary,
  TriggeredWorkflowResponse,
  WorkflowExecutionDetail,
  WorkflowExecutionSummary,
} from '../../integrations/types';
import type { AdapterRequestContext } from '../../integrations/tracing';

export type PaginationInput = {
  limit?: number;
  cursor?: string;
};

export interface OdooAdapter extends PlatformAdapter {
  findCustomers(query: { search?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CustomerSummary[]>>;
  getCustomerById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CustomerDetail>>;
  createOrUpdateCustomer(payload: { id?: string; displayName: string; email?: string; phone?: string; companyName?: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CustomerDetail>>;
  listInvoices(filters: { customerId?: string; status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<InvoiceSummary[]>>;
  getInvoiceById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<InvoiceDetail>>;
  listSupportTickets(filters: { customerId?: string; status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<SupportTicketSummary[]>>;
  getSupportTicketById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<SupportTicketDetail>>;
  listKnowledgeItems(filters: { search?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<KnowledgeItemSummary[]>>;
  getCompanyContext(context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CompanyContext>>;
}

export interface LendingAdapter extends PlatformAdapter {
  listApplications(filters: { status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<ApplicationSummary[]>>;
  getApplicationById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<ApplicationDetail>>;
  createApplication(payload: { applicantName: string; applicantId?: string; requestedAmount?: number; currency?: string; productName?: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<ApplicationDetail>>;
  updateApplicationStatus(id: string, payload: { status: string; reason?: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<ApplicationDetail>>;
  listLoans(filters: { status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<LoanSummary[]>>;
  getLoanById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<LoanDetail>>;
  findBorrowers(query: { search?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<BorrowerSummary[]>>;
  getBorrowerById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<BorrowerSummary>>;
  listApplicationRequirements(applicationId: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<RequirementSummary[]>>;
  listApplicationDocuments(applicationId: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<DocumentSummary[]>>;
}

export interface MarbleAdapter extends PlatformAdapter {
  getDecisionById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<DecisionDetail>>;
  listDecisions(filters: { subjectId?: string; outcome?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<DecisionSummary[]>>;
  evaluateSubject(payload: { subjectId: string; subjectType?: string; attributes?: Record<string, unknown> }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<DecisionDetail>>;
  getSubjectDecisionHistory(subjectRef: { subjectId: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<DecisionSummary[]>>;
  listCases(filters: { subjectId?: string; status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CaseSummary[]>>;
  getCaseById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<CaseDetail>>;
  getRiskSummaryForSubject(subjectRef: { subjectId: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<RiskSummary>>;
}

export interface N8nAdapter extends PlatformAdapter {
  triggerWorkflow(workflowKeyOrId: string, payload: Record<string, unknown>, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<TriggeredWorkflowResponse>>;
  getWorkflowExecutionById(id: string, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<WorkflowExecutionDetail>>;
  listWorkflowExecutions(filters: { workflowId?: string; status?: string } & PaginationInput, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<WorkflowExecutionSummary[]>>;
  getWorkflowStatus(reference: { executionId?: string; workflowId?: string }, context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<WorkflowExecutionSummary>>;
  listAvailableWorkflows(context?: AdapterRequestContext): Promise<AdapterResponseEnvelope<Array<{ id: string; name: string; active: boolean }>>>;
}

export type PlatformAdapterRegistry = {
  odoo: OdooAdapter;
  lending: LendingAdapter;
  marble: MarbleAdapter;
  n8n: N8nAdapter;
};

export type AdapterRegistryKey = keyof PlatformAdapterRegistry;
export type { AdapterHealth, AdapterCapability, AdapterSourceInfo };
