import { BasePlatformAdapter } from '../base/base-adapter';
import type { AdapterHealth } from '../../integrations/health';
import type { MarbleAdapter } from '../base/types';
import type { MarbleAdapterConfig } from '../../integrations/config';
import { PlatformHttpClient } from '../../integrations/http';
import { createTracingHeaders, type AdapterRequestContext } from '../../integrations/tracing';
import { createMarbleAuthHeaders } from './marble-auth';
import type { MarbleCaseRecord, MarbleDecisionRecord, MarbleRiskRecord } from './marble-types';
import { mapCaseDetail, mapCaseSummary, mapDecisionDetail, mapDecisionSummary, mapRiskSummary } from './marble-mappers';

const capabilities = [
  { key: 'decisions.read', label: 'Decisions', supportsWrite: true, description: 'Decision history and subject evaluation.' },
  { key: 'cases.read', label: 'Cases', supportsWrite: false, description: 'Case list and detail.' },
  { key: 'risk.read', label: 'Risk summary', supportsWrite: false, description: 'Subject risk summary.' },
];

export class MarblePlatformAdapter extends BasePlatformAdapter implements MarbleAdapter {
  constructor(private readonly config: MarbleAdapterConfig, fetchImpl?: typeof fetch) {
    super(
      { adapterKey: 'marble', displayName: 'Marble', baseUrl: config.baseUrl, mode: config.mode },
      new PlatformHttpClient({ sourceSystem: 'marble', baseUrl: config.baseUrl, timeoutMs: config.timeoutMs, retryCount: config.retryCount, fetchImpl }),
      capabilities,
    );
  }

  async getHealth(context?: AdapterRequestContext): Promise<AdapterHealth> {
    if (this.config.mode === 'mock') {
      return { adapterKey: 'marble', status: 'healthy', authStatus: 'unknown', checkedAt: new Date().toISOString(), details: { mode: 'mock' } };
    }
    return this.basicHealthCheck(context, '/health', 'marble.health');
  }

  async getDecisionById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.getDecisionById', async (correlationId) => mapDecisionDetail(await this.request(`/api/decisions/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async listDecisions(filters: { subjectId?: string; outcome?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.listDecisions', async (correlationId) => {
      const rows = await this.request<MarbleDecisionRecord[]>('/api/decisions', { subjectId: filters.subjectId, outcome: filters.outcome, limit: filters.limit }, correlationId, context);
      return rows.map((record) => mapDecisionSummary(record, this.config.baseUrl));
    });
  }

  async evaluateSubject(payload: { subjectId: string; subjectType?: string; attributes?: Record<string, unknown> }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.evaluateSubject', async (correlationId) => {
      const record = await this.httpClient.requestJson<MarbleDecisionRecord>({
        path: '/api/evaluations',
        method: 'POST',
        operation: 'marble.evaluateSubject',
        correlationId,
        retryable: false,
        headers: createTracingHeaders({ ...context, correlationId }),
        authHeaders: createMarbleAuthHeaders(this.config),
        body: payload,
      });
      return mapDecisionDetail(record, this.config.baseUrl);
    });
  }

  async getSubjectDecisionHistory(subjectRef: { subjectId: string }, context?: AdapterRequestContext) {
    return this.listDecisions({ subjectId: subjectRef.subjectId }, context);
  }

  async listCases(filters: { subjectId?: string; status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.listCases', async (correlationId) => {
      const rows = await this.request<MarbleCaseRecord[]>('/api/cases', { subjectId: filters.subjectId, status: filters.status, limit: filters.limit }, correlationId, context);
      return rows.map((record) => mapCaseSummary(record, this.config.baseUrl));
    });
  }

  async getCaseById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.getCaseById', async (correlationId) => mapCaseDetail(await this.request(`/api/cases/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async getRiskSummaryForSubject(subjectRef: { subjectId: string }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'marble.getRiskSummaryForSubject', async (correlationId) => mapRiskSummary(await this.request(`/api/subjects/${subjectRef.subjectId}/risk`, undefined, correlationId, context), this.config.baseUrl));
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
      authHeaders: createMarbleAuthHeaders(this.config),
    });
  }
}
