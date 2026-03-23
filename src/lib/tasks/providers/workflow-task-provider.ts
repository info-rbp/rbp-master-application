import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';
import type { TaskProvider, TaskQuery, TaskRecord } from '@/lib/tasks/types';

function buildActions(workflowType: string, workflowInstanceId: string) {
  const route = `/api/workflows/${workflowInstanceId}`;
  if (workflowType === 'review_approval') {
    return [
      { key: 'open', label: 'Open workflow', type: 'navigate', enabled: true, requiresConfirmation: false, route },
      { key: 'approve', label: 'Approve', type: 'approve', enabled: true, requiresConfirmation: true, apiAction: 'approve' },
      { key: 'reject', label: 'Reject', type: 'reject', enabled: true, requiresConfirmation: true, apiAction: 'reject' },
    ];
  }
  return [
    { key: 'open', label: 'Open workflow', type: 'navigate', enabled: true, requiresConfirmation: false, route },
    { key: 'complete', label: 'Complete', type: 'complete', enabled: true, requiresConfirmation: true, apiAction: 'complete' },
  ];
}

export class WorkflowTaskProvider implements TaskProvider {
  readonly key = 'workflow';
  private readonly store = getWorkflowStore();

  async listTasks(query: TaskQuery) {
    const snapshot = await this.store.read();
    const statuses = new Set(['waiting_internal', 'waiting_external', 'partially_completed', 'failed']);
    const items: TaskRecord[] = snapshot.instances
      .filter((item) => item.tenantId === query.tenantId)
      .filter((item) => statuses.has(item.status))
      .map((item) => ({
        id: `workflow:${item.id}`,
        taskType: `${item.workflowType}_workflow`,
        title: `Workflow ${item.workflowType.replace(/_/g, ' ')} for ${item.relatedEntityId}`,
        description: item.failureSummary?.message ?? item.currentStep,
        tenantId: item.tenantId,
        workspaceId: item.workspaceId,
        status: item.status === 'failed' ? 'blocked' : item.status === 'waiting_external' ? 'waiting_external' : 'waiting_internal',
        priority: item.status === 'failed' ? 'critical' : item.workflowType === 'billing_event' ? 'urgent' : 'high',
        urgencyScore: item.status === 'failed' ? 95 : 70,
        sourceSystem: 'platform',
        sourceRef: item.sourceSystemRefs[0],
        sourceTaskType: item.workflowType,
        relatedEntityType: item.relatedEntityType,
        relatedEntityId: item.relatedEntityId,
        assigneeType: 'tenant_admins',
        assigneeId: 'role_tenant_admin',
        assigneeDisplay: 'Tenant admins',
        queue: item.workflowType === 'billing_event' ? 'finance_ops' : item.workflowType === 'document_upload' ? 'document_review' : item.workflowType === 'support_escalation' ? 'ops_escalations' : 'workflow_ops',
        dueAt: item.updatedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        availableActions: buildActions(item.workflowType, item.id),
        warnings: [],
        metadata: { workflowInstanceId: item.id, workflowType: item.workflowType },
        moduleKey: item.workflowType === 'billing_event' ? 'finance' : item.relatedEntityType === 'support_ticket' ? 'support' : item.relatedEntityType === 'loan' ? 'loans' : item.relatedEntityType === 'document' ? 'documents' : 'applications',
      }))
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.search || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.search.toLowerCase()));
    return { items };
  }

  async getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>) {
    const items = await this.listTasks({ tenantId: query.tenantId, userId: query.userId, internalUser: query.internalUser, page: 1, pageSize: 100, correlationId: query.correlationId });
    return items.items.find((item) => item.id === taskId) ?? null;
  }

  supportsAction(task: TaskRecord, action: string) {
    return task.id.startsWith('workflow:') && ['approve', 'reject', 'complete'].includes(action);
  }
}
