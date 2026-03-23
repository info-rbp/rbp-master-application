export type CreatedTask = { id: string; title: string; queue?: string; status: 'open' | 'pending' | 'completed' };
export type CreatedNotification = { id: string; title: string; severity: 'info' | 'warning' | 'error' };

export class WorkflowTaskNotificationHooks {
  async createTask(input: { workflowInstanceId: string; title: string; queue?: string }) : Promise<CreatedTask> {
    return { id: `task_${crypto.randomUUID()}`, title: input.title, queue: input.queue, status: 'open' };
  }

  async createNotification(input: { workflowInstanceId: string; title: string; severity: 'info' | 'warning' | 'error' }): Promise<CreatedNotification> {
    return { id: `notif_${crypto.randomUUID()}`, title: input.title, severity: input.severity };
  }
}
