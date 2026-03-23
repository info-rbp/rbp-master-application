import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { TaskProvider, TaskQuery, TaskRecord } from '@/lib/tasks/types';

export class MarbleTaskProvider implements TaskProvider {
  readonly key = 'marble';
  private readonly adapters = getPlatformAdapters();

  async listTasks(query: TaskQuery) {
    const ctx = { correlationId: query.correlationId, tenantId: query.tenantId, workspaceId: query.workspaceId, actingUserId: query.userId };
    const cases = await this.adapters.marble.listCases({ status: 'open', limit: Math.min(query.pageSize * 2, 20) }, ctx);
    const items: TaskRecord[] = cases.data.map((item) => ({
      id: `marble:${item.id}`,
      taskType: 'compliance_review',
      title: `Review case ${item.id}`,
      description: item.queue,
      tenantId: query.tenantId,
      workspaceId: query.workspaceId,
      status: 'waiting_internal',
      priority: 'critical',
      urgencyScore: 92,
      sourceSystem: 'marble',
      sourceRef: item.sourceRef,
      sourceTaskType: 'case',
      relatedEntityType: 'case',
      relatedEntityId: item.id,
      assigneeType: 'queue',
      assigneeId: item.queue ?? 'risk_review',
      assigneeDisplay: item.queue ?? 'Risk review',
      queue: item.queue ?? 'risk_review',
      dueAt: item.createdAt,
      createdAt: item.createdAt ?? new Date().toISOString(),
      updatedAt: item.createdAt ?? new Date().toISOString(),
      availableActions: [
        { key: 'open', label: 'Open', type: 'navigate', enabled: true, requiresConfirmation: false, route: `/admin/crm?case=${item.id}` },
        { key: 'escalate', label: 'Escalate', type: 'escalate', enabled: true, requiresConfirmation: true, apiAction: 'escalate' },
      ],
      warnings: [],
      metadata: { queue: item.queue },
      moduleKey: 'applications',
    })).filter((item) => !query.search || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.search.toLowerCase()));
    return { items };
  }

  async getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>) {
    const items = await this.listTasks({ tenantId: query.tenantId, userId: query.userId, internalUser: query.internalUser, page: 1, pageSize: 100, correlationId: query.correlationId });
    return items.items.find((item) => item.id === taskId) ?? null;
  }

  supportsAction(task: TaskRecord, action: string) {
    return task.sourceSystem === 'marble' && ['escalate'].includes(action);
  }
}
