import type { SourceReference, TriggeredWorkflowResponse, WorkflowExecutionDetail, WorkflowExecutionSummary } from '../../integrations/types';
import type { N8nExecutionRecord, N8nTriggerResponseRecord } from './n8n-types';

function sourceRef(type: string, id: string, baseUrl?: string): SourceReference {
  return {
    sourceSystem: 'n8n',
    sourceRecordType: type,
    sourceRecordId: id,
    sourceUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/${type}/${id}` : undefined,
    syncedAt: new Date().toISOString(),
  };
}

export function mapExecutionSummary(record: N8nExecutionRecord, baseUrl?: string): WorkflowExecutionSummary {
  return {
    id: record.id,
    workflowId: record.workflow_id,
    workflowName: record.workflow_name,
    status: record.status,
    startedAt: record.started_at,
    finishedAt: record.finished_at,
    sourceRef: sourceRef('execution', record.id, baseUrl),
  };
}

export function mapExecutionDetail(record: N8nExecutionRecord, baseUrl?: string): WorkflowExecutionDetail {
  return {
    ...mapExecutionSummary(record, baseUrl),
    resultSummary: record.result_summary,
  };
}

export function mapTriggerResponse(workflowId: string, record: N8nTriggerResponseRecord, baseUrl?: string): TriggeredWorkflowResponse {
  return {
    accepted: record.accepted,
    executionId: record.execution_id,
    status: record.status,
    sourceRef: sourceRef('workflow', workflowId, baseUrl),
  };
}
