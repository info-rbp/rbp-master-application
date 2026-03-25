import { BasePlatformAdapter } from '../base/base-adapter';
import type { AdapterHealth } from '../../integrations/health';
import type { LendingAdapter } from '../base/types';
import type { LendingAdapterConfig } from '../../integrations/config';
import { PlatformHttpClient } from '../../integrations/http';
import { createTracingHeaders, type AdapterRequestContext } from '../../integrations/tracing';
import { createLendingAuthHeaders } from './lending-auth';
import type { LendingApplicationRecord, LendingBorrowerRecord, LendingDocumentRecord, LendingLoanRecord, LendingRequirementRecord } from './lending-types';
import { mapApplicationDetail, mapApplicationSummary, mapBorrower, mapDocument, mapLoanDetail, mapLoanSummary, mapRequirement } from './lending-mappers';

const capabilities = [
  { key: 'applications.read', label: 'Applications', supportsWrite: true, description: 'Loan application list/detail/create/status.' },
  { key: 'loans.read', label: 'Loans', supportsWrite: false, description: 'Loan list/detail.' },
  { key: 'borrowers.read', label: 'Borrowers', supportsWrite: false, description: 'Borrower search/detail.' },
  { key: 'documents.read', label: 'Requirements and documents', supportsWrite: false, description: 'Application requirements and documents.' },
];

export class LendingPlatformAdapter extends BasePlatformAdapter implements LendingAdapter {
  constructor(private readonly config: LendingAdapterConfig, fetchImpl?: typeof fetch) {
    super(
      { adapterKey: 'lending', displayName: 'Frappe Lending', baseUrl: config.baseUrl, mode: config.mode },
      new PlatformHttpClient({ sourceSystem: 'lending', baseUrl: config.baseUrl, timeoutMs: config.timeoutMs, retryCount: config.retryCount, fetchImpl }),
      capabilities,
    );
  }

  async getHealth(context?: AdapterRequestContext): Promise<AdapterHealth> {
    if (this.config.mode === 'mock') {
      return { adapterKey: 'lending', status: 'healthy', authStatus: 'unknown', checkedAt: new Date().toISOString(), details: { mode: 'mock' } };
    }
    return this.basicHealthCheck(context, '/api/method/ping', 'lending.health');
  }

  async listApplications(filters: { status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.listApplications', async (correlationId) => {
      const rows = await this.request<LendingApplicationRecord[]>('/api/applications', { status: filters.status, limit: filters.limit }, correlationId, context);
      return rows.map((record) => mapApplicationSummary(record, this.config.baseUrl));
    });
  }

  async getApplicationById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.getApplicationById', async (correlationId) => mapApplicationDetail(await this.request(`/api/applications/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async createApplication(payload: { applicantName: string; applicantId?: string; requestedAmount?: number; currency?: string; productName?: string }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.createApplication', async (correlationId) => {
      const record = await this.httpClient.requestJson<LendingApplicationRecord>({
        path: '/api/applications',
        method: 'POST',
        operation: 'lending.createApplication',
        correlationId,
        retryable: false,
        headers: createTracingHeaders({ ...context, correlationId }),
        authHeaders: createLendingAuthHeaders(this.config),
        body: {
          applicant_name: payload.applicantName,
          applicant_id: payload.applicantId,
          requested_amount: payload.requestedAmount,
          currency: payload.currency,
          product_name: payload.productName,
        },
      });
      return mapApplicationDetail(record, this.config.baseUrl);
    });
  }

  async updateApplicationStatus(id: string, payload: { status: string; reason?: string }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.updateApplicationStatus', async (correlationId) => {
      const record = await this.httpClient.requestJson<LendingApplicationRecord>({
        path: `/api/applications/${id}/status`,
        method: 'POST',
        operation: 'lending.updateApplicationStatus',
        correlationId,
        retryable: false,
        headers: createTracingHeaders({ ...context, correlationId }),
        authHeaders: createLendingAuthHeaders(this.config),
        body: payload,
      });
      return mapApplicationDetail(record, this.config.baseUrl);
    });
  }

  async listLoans(filters: { status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.listLoans', async (correlationId) => {
      const rows = await this.request<LendingLoanRecord[]>('/api/loans', { status: filters.status, limit: filters.limit }, correlationId, context);
      return rows.map((record) => mapLoanSummary(record, this.config.baseUrl));
    });
  }

  async getLoanById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.getLoanById', async (correlationId) => mapLoanDetail(await this.request(`/api/loans/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async findBorrowers(query: { search?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.findBorrowers', async (correlationId) => {
      const rows = await this.request<LendingBorrowerRecord[]>('/api/borrowers', { search: query.search, limit: query.limit }, correlationId, context);
      return rows.map((record) => mapBorrower(record, this.config.baseUrl));
    });
  }

  async getBorrowerById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.getBorrowerById', async (correlationId) => mapBorrower(await this.request(`/api/borrowers/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async listApplicationRequirements(applicationId: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.listApplicationRequirements', async (correlationId) => {
      const rows = await this.request<LendingRequirementRecord[]>(`/api/applications/${applicationId}/requirements`, undefined, correlationId, context);
      return rows.map((record) => mapRequirement(record, this.config.baseUrl));
    });
  }

  async listApplicationDocuments(applicationId: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'lending.listApplicationDocuments', async (correlationId) => {
      const rows = await this.request<LendingDocumentRecord[]>(`/api/applications/${applicationId}/documents`, undefined, correlationId, context);
      return rows.map((record) => mapDocument(record, this.config.baseUrl));
    });
  }

  private async request<T>(path: string, query: Record<string, string | number | undefined> | undefined, correlationId: string, context?: AdapterRequestContext) {
    return this.httpClient.requestJson<T>({
      path,
      query,
      method: 'GET',
      operation: path,
      correlationId,
      retryable: true,
      headers: createTracingHeaders({ ...context, correlationId }),
      authHeaders: createLendingAuthHeaders(this.config),
    });
  }
}
