import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { TaskProvider, TaskQuery, TaskRecord } from '@/lib/tasks/types';

function priorityFromStatus(status: string) {
  if (status === 'submitted') return 'urgent' as const;
  if (status === 'review') return 'high' as const;
  return 'normal' as const;
}

export class LendingTaskProvider implements TaskProvider {
  readonly key = 'lending';
  private readonly adapters = getPlatformAdapters();

  async listTasks(query: TaskQuery) {
    const ctx = { correlationId: query.correlationId, tenantId: query.tenantId, workspaceId: query.workspaceId, actingUserId: query.userId };
    const applications = await this.adapters.lending.listApplications({ status: ['open', 'in_progress'].includes(query.status ?? '') ? undefined : undefined, limit: Math.min(query.pageSize * 2, 20) }, ctx);
    const items: TaskRecord[] = applications.data
      .filter((item) => ['submitted', 'under_review', 'pending_review'].includes(item.status))
      .map((item) => ({
        id: `lending:${item.id}`,
        taskType: 'application_review',
        title: `Review application ${item.id}`,
        description: item.applicantName,
        tenantId: query.tenantId,
        workspaceId: query.workspaceId,
        status: 'open',
        priority: priorityFromStatus(item.status),
        urgencyScore: item.status === 'submitted' ? 78 : 58,
        sourceSystem: 'lending',
        sourceRef: item.sourceRef,
        sourceTaskType: 'application',
        relatedEntityType: 'application',
        relatedEntityId: item.id,
        relatedEntityDisplay: item.applicantName,
        assigneeType: 'queue',
        assigneeId: 'credit_review',
        assigneeDisplay: 'Credit review',
        queue: 'credit_review',
        dueAt: item.submittedAt,
        createdAt: item.submittedAt ?? new Date().toISOString(),
        updatedAt: item.submittedAt ?? new Date().toISOString(),
        availableActions: [
          { key: 'open', label: 'Open', type: 'navigate', enabled: true, requiresConfirmation: false, route: `/applications/${item.id}` },
          { key: 'approve', label: 'Approve', type: 'approve', enabled: true, requiresConfirmation: true, apiAction: 'approve' },
          { key: 'request_info', label: 'Request info', type: 'request_info', enabled: true, requiresConfirmation: false, apiAction: 'request_info' },
        ],
        warnings: [],
        metadata: {},
        moduleKey: 'applications',
      }))
      .filter((item) => !query.search || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.search.toLowerCase()));
    return { items };
  }

  async getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>) {
    const items = await this.listTasks({ tenantId: query.tenantId, userId: query.userId, internalUser: query.internalUser, page: 1, pageSize: 100, correlationId: query.correlationId });
    return items.items.find((item) => item.id === taskId) ?? null;
  }

  supportsAction(task: TaskRecord, action: string) {
    return task.sourceSystem === 'lending' && ['approve', 'request_info'].includes(action);
  }
}
