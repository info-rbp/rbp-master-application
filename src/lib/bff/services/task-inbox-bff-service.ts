import type { TaskActionResultDto, TaskListDto, TaskSummaryDto } from '@/lib/bff/dto/task';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { TaskService } from '@/lib/tasks/service';

export class TaskInboxBffService {
  private readonly tasks = new TaskService();

  async listTasks(context: BffRequestContext, filters: { status?: string; priority?: string; sourceSystem?: string; relatedEntityType?: string; relatedEntityId?: string; queue?: string; assignment?: 'mine' | 'team' | 'all'; search?: string; page?: number; pageSize?: number; limit?: number } = {}): Promise<TaskListDto> {
    return this.tasks.listTasks(context, filters) as Promise<TaskListDto>;
  }

  async getSummary(context: BffRequestContext, filters: Record<string, unknown> = {}): Promise<TaskSummaryDto> {
    return (await this.tasks.listTasks(context, filters)).summary as TaskSummaryDto;
  }

  async runAction(context: BffRequestContext, taskId: string, action: string, payload: Record<string, unknown> = {}): Promise<TaskActionResultDto> {
    return this.tasks.performAction(context, taskId, action, payload) as Promise<TaskActionResultDto>;
  }
}
