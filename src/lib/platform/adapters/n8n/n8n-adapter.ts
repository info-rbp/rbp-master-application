import { BasePlatformAdapter } from '../base/base-adapter';
import type { AdapterHealth } from '../../integrations/health';
import type { N8nAdapter } from '../base/types';
import type { N8nAdapterConfig } from '../../integrations/config';
import { PlatformHttpClient } from '../../integrations/http';
import { createTracingHeaders, type AdapterRequestContext } from '../../integrations/tracing';
import { createN8nAuthHeaders } from './n8n-auth';
import type { N8nExecutionRecord, N8nTriggerResponseRecord, N8nWorkflowRecord } from './n8n-types';
import { mapExecutionDetail, mapExecutionSummary, mapTriggerResponse } from './n8n-mappers';

const capabilities = [
  { key: 'workflows.execute', label: 'Workflow trigger', supportsWrite: true, description: 'Trigger workflows through n8n.' },
  { key: 'workflows.executions.read', label: 'Execution status', supportsWrite: false, description: 'Execution list/detail/status.' },
  { key: 'workflows.list', label: 'Workflow catalogue', supportsWrite: false, description: 'Available workflow lookup.' },
];

export class N8nPlatformAdapter extends BasePlatformAdapter implements N8nAdapter {
  constructor(private readonly config: N8nAdapterConfig, fetchImpl?: typeof fetch) {
    super(
      { adapterKey: 'n8n', displayName: 'n8n', baseUrl: config.baseUrl, mode: config.mode },
      new PlatformHttpClient({ sourceSystem: 'n8n', baseUrl: config.baseUrl, timeoutMs: config.timeoutMs, retryCount: config.retryCount, fetchImpl }),
      capabilities,
    );
  }

  async getHealth(context?: AdapterRequestContext): Promise<AdapterHealth> {
    if (this.config.mode === 'mock') {
      return { adapterKey: 'n8n', status: 'healthy', authStatus: 'unknown', checkedAt: new Date().toISOString(), details: { mode: 'mock' } };
    }
    return this.basicHealthCheck(context, '/healthz', 'n8n.health');
  }

  async triggerWorkflow(workflowKeyOrId: string, payload: Record<string, unknown>, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'n8n.triggerWorkflow', async (correlationId) => {
      const record = await this.httpClient.requestJson<N8nTriggerResponseRecord>({
        path: `/api/workflows/${workflowKeyOrId}/trigger`,
        method: 'POST',
        operation: 'n8n.triggerWorkflow',
        correlationId,
        retryable: false,
        headers: createTracingHeaders({ ...context, correlationId }),
        authHeaders: createN8nAuthHeaders(this.config),
        body: payload,
      });
      return mapTriggerResponse(workflowKeyOrId, record, this.config.baseUrl);
    });
  }

  async getWorkflowExecutionById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'n8n.getWorkflowExecutionById', async (correlationId) => mapExecutionDetail(await this.request(`/api/executions/${id}`, undefined, correlationId, context), this.config.baseUrl));
  }

  async listWorkflowExecutions(filters: { workflowId?: string; status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'n8n.listWorkflowExecutions', async (correlationId) => {
      const rows = await this.request<N8nExecutionRecord[]>('/api/executions', { workflowId: filters.workflowId, status: filters.status, limit: filters.limit }, correlationId, context);
      return rows.map((record) => mapExecutionSummary(record, this.config.baseUrl));
    });
  }

  async getWorkflowStatus(reference: { executionId?: string; workflowId?: string }, context?: AdapterRequestContext) {
    if (reference.executionId) {
      return this.withEnvelope(context, 'n8n.getWorkflowStatus.execution', async (correlationId) => mapExecutionSummary(await this.request(`/api/executions/${reference.executionId}`, undefined, correlationId, context), this.config.baseUrl));
    }

    return this.withEnvelope(context, 'n8n.getWorkflowStatus.workflow', async (correlationId) => {
      const rows = await this.request<N8nExecutionRecord[]>('/api/executions', { workflowId: reference.workflowId, limit: 1 }, correlationId, context);
      return mapExecutionSummary(rows[0], this.config.baseUrl);
    });
  }

  async listAvailableWorkflows(context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'n8n.listAvailableWorkflows', async (correlationId) => {
      const rows = await this.request<N8nWorkflowRecord[]>('/api/workflows', undefined, correlationId, context);
      return rows.map((row) => ({ id: row.id, name: row.name, active: row.active }));
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
      authHeaders: createN8nAuthHeaders(this.config),
    });
  }
}
