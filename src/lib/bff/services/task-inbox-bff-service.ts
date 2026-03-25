import type { TaskListDto } from '@/lib/bff/dto/task';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { TaskService } from '@/lib/tasks/service';

export class TaskInboxBffService {
  private readonly tasks = new TaskService();

  async listTasks(context: BffRequestContext, filters: { status?: string; sourceSystem?: string; relatedEntityType?: string; relatedEntityId?: string; limit?: number } = {}): Promise<TaskListDto> {
    const result = await this.tasks.listTasks(context, { ...filters, assignment: 'all', pageSize: filters.limit ?? 20 });
    return {
      items: result.items.map((item) => ({
        id: item.id,
        taskType: item.taskType,
        title: item.title,
        description: item.description,
        status: { category: item.status, code: item.status, label: item.status.replaceAll('_', ' ') },
        priority: item.priority === 'urgent' ? 'high' : item.priority === 'normal' ? 'medium' : item.priority,
        sourceSystem: item.sourceSystem,
        relatedEntityType: item.relatedEntityType,
        relatedEntityId: item.relatedEntityId,
        assignee: item.assigneeDisplay ?? item.assigneeId,
        queue: item.queue,
        dueAt: item.dueAt,
        availableActions: item.availableActions.filter((action) => action.enabled).map((action) => ({ key: action.key, label: action.label })),
        sourceRefs: item.sourceRef ? [item.sourceRef] : [],
        warnings: item.warnings,
      })),
      summary: { total: result.total, open: result.summary.totalOpen, overdue: result.summary.overdue, bySource: result.summary.bySourceSystem },
      filters: { status: ['open', 'in_progress', 'waiting_internal', 'waiting_external', 'blocked', 'completed'], sourceSystem: Object.keys(result.summary.bySourceSystem) },
      pagination: { limit: result.pageSize, total: result.total },
    };
  }

  async runAction(context: BffRequestContext, taskId: string, action: string, payload: Record<string, unknown> = {}) {
    return this.tasks.performAction(context, taskId, action, payload);
  }
}
