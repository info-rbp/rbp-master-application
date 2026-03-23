import { getTaskStore } from '@/lib/tasks/store';
import type { TaskProvider, TaskQuery } from '@/lib/tasks/types';

export class InternalTaskProvider implements TaskProvider {
  readonly key = 'platform';
  private readonly store = getTaskStore();

  async listTasks(query: TaskQuery) {
    const items = (await this.store.listTasks())
      .filter((item) => item.tenantId === query.tenantId)
      .filter((item) => !query.workspaceId || !item.workspaceId || item.workspaceId === query.workspaceId)
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.priority || item.priority === query.priority)
      .filter((item) => !query.queue || item.queue === query.queue)
      .filter((item) => !query.relatedEntityType || item.relatedEntityType === query.relatedEntityType)
      .filter((item) => !query.relatedEntityId || item.relatedEntityId === query.relatedEntityId)
      .filter((item) => !query.search || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.search.toLowerCase()))
      .filter((item) => {
        if (query.assignment === 'all' && query.internalUser) return true;
        if (query.assignment === 'team') return item.assigneeType !== 'user' || item.assigneeId !== query.userId;
        return !item.assigneeId || item.assigneeId === query.userId || item.assigneeType === 'tenant_admins';
      });
    return { items };
  }

  async getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>) {
    const task = await this.store.getTask(taskId);
    if (!task || task.tenantId !== query.tenantId) return null;
    if (!query.internalUser && task.assigneeType === 'queue' && task.assigneeId && task.assigneeId !== query.userId) return null;
    return task;
  }

  supportsAction(task: any, action: string) {
    return task.sourceSystem === 'platform' && ['assign', 'complete', 'acknowledge', 'escalate', 'approve', 'reject', 'request_info'].includes(action);
  }
}
