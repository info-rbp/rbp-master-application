import type { AdapterHealth } from './health';
import type { AdapterRequestContext } from './tracing';

export type IntegrationSourceSystem =
  | 'platform'
  | 'authentik'
  | 'odoo'
  | 'lending'
  | 'marble'
  | 'n8n'
  | 'docspell'
  | 'metabase';

export type SourceReference = {
  sourceSystem: IntegrationSourceSystem;
  sourceRecordType: string;
  sourceRecordId: string;
  sourceUrl?: string;
  syncedAt: string;
};

export type CorrelationMetadata = {
  correlationId: string;
  requestId?: string;
  tenantId?: string;
  workspaceId?: string;
  actorUserId?: string;
};

export type IntegrationWarning = {
  code: string;
  message: string;
  sourceSystem: IntegrationSourceSystem;
  retryable: boolean;
  correlationId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
};

export type NormalizedAdapterError = {
  code: string;
  sourceSystem: IntegrationSourceSystem | string;
  operation: string;
  message: string;
  retryable: boolean;
  httpStatus?: number;
  upstreamStatus?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export type IntegrationCriticality = 'launch_critical' | 'internal_accelerator' | 'optional';
export type IntegrationFailureMode = 'fail_open' | 'fail_closed';

export type IntegrationRuntimePolicy = {
  adapterKey: string;
  mode: 'live' | 'mock' | 'disabled';
  enabled: boolean;
  criticality: IntegrationCriticality;
  defaultFailureMode: IntegrationFailureMode;
  timeoutMs: number;
  retryCount: number;
  rolloutFlag: string;
};

export type AdapterCapability = {
  key: string;
  label: string;
  supportsWrite: boolean;
  description: string;
  stage?: 'ga' | 'beta' | 'experimental';
  rolloutFlag?: string;
};

export type AdapterSourceInfo = {
  adapterKey: string;
  displayName: string;
  baseUrl?: string;
  mode: 'live' | 'mock' | 'disabled';
};

export type AdapterResultMeta = {
  correlationId: string;
  source: AdapterSourceInfo;
  receivedAt: string;
  raw?: unknown;
};

export type AdapterResponseEnvelope<T> = {
  data: T;
  meta: AdapterResultMeta;
};

export type CustomerSummary = {
  id: string;
  externalReference?: string;
  displayName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
  sourceRef: SourceReference;
};

export type CustomerDetail = CustomerSummary & {
  billingAddress?: string;
  shippingAddress?: string;
  tags: string[];
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  currency: string;
  amountTotal: number;
  amountDue: number;
  status: string;
  issuedAt?: string;
  dueAt?: string;
  sourceRef: SourceReference;
};

export type InvoiceDetail = InvoiceSummary & {
  lines: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
};

export type SupportTicketSummary = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceRef: SourceReference;
};

export type SupportTicketDetail = SupportTicketSummary & {
  description?: string;
  assigneeName?: string;
};

export type KnowledgeItemSummary = {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  status: string;
  sourceRef: SourceReference;
};

export type CompanyContext = {
  companyId: string;
  companyName: string;
  currency?: string;
  country?: string;
  sourceRef: SourceReference;
};

export type ApplicationSummary = {
  id: string;
  applicantId?: string;
  applicantName: string;
  status: string;
  productName?: string;
  submittedAt?: string;
  sourceRef: SourceReference;
};

export type ApplicationDetail = ApplicationSummary & {
  requestedAmount?: number;
  currency?: string;
  stage?: string;
};

export type LoanSummary = {
  id: string;
  borrowerId?: string;
  borrowerName: string;
  status: string;
  principalAmount?: number;
  outstandingAmount?: number;
  currency?: string;
  sourceRef: SourceReference;
};

export type LoanDetail = LoanSummary & {
  servicingState?: string;
  nextPaymentDueAt?: string;
};

export type BorrowerSummary = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: string;
  sourceRef: SourceReference;
};

export type RequirementSummary = {
  id: string;
  name: string;
  status: string;
  required: boolean;
  sourceRef: SourceReference;
};

export type DocumentSummary = {
  id: string;
  name: string;
  status: string;
  uploadedAt?: string;
  sourceRef: SourceReference;
};

export type DecisionSummary = {
  id: string;
  subjectId?: string;
  outcome: string;
  reviewState?: string;
  reasonCodes: string[];
  createdAt?: string;
  sourceRef: SourceReference;
};

export type DecisionDetail = DecisionSummary & {
  score?: number;
  caseId?: string;
};

export type CaseSummary = {
  id: string;
  subjectId?: string;
  status: string;
  queue?: string;
  createdAt?: string;
  sourceRef: SourceReference;
};

export type CaseDetail = CaseSummary & {
  assignee?: string;
  resolution?: string;
};

export type RiskSummary = {
  subjectId: string;
  riskLevel: string;
  latestDecisionId?: string;
  flags: string[];
  sourceRef: SourceReference;
};

export type WorkflowExecutionSummary = {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  sourceRef: SourceReference;
};

export type WorkflowExecutionDetail = WorkflowExecutionSummary & {
  resultSummary?: string;
};

export type TriggeredWorkflowResponse = {
  accepted: boolean;
  executionId?: string;
  status: string;
  sourceRef: SourceReference;
};

export interface PlatformAdapter {
  getHealth(context?: AdapterRequestContext): Promise<AdapterHealth>;
  getCapabilities(context?: AdapterRequestContext): Promise<AdapterCapability[]>;
  getRuntimePolicy(context?: AdapterRequestContext): Promise<IntegrationRuntimePolicy>;
  getSourceInfo(): AdapterSourceInfo;
}
