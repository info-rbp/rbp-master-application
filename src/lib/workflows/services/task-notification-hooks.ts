import { NotificationService } from '@/lib/notifications-center/service';

export type CreatedTask = { id: string; title: string; queue?: string; status: 'open' | 'pending' | 'completed' };
export type CreatedNotification = { id: string; title: string; severity: 'info' | 'warning' | 'error' };

export class WorkflowTaskNotificationHooks {
  private readonly notifications = new NotificationService();

  async createTask(input: { workflowInstanceId: string; title: string; queue?: string }) : Promise<CreatedTask> {
    return { id: `task_${crypto.randomUUID()}`, title: input.title, queue: input.queue, status: 'open' };
  }

  async createNotification(input: { workflowInstanceId: string; tenantId?: string; workspaceId?: string; title: string; severity: 'info' | 'warning' | 'error'; relatedEntityType?: string; relatedEntityId?: string; recipientType?: 'user' | 'tenant_admins' | 'queue'; recipientId?: string; correlationId?: string }): Promise<CreatedNotification> {
    const created = await this.notifications.create({
      tenantId: input.tenantId ?? 'ten_rbp_internal',
      workspaceId: input.workspaceId,
      recipientType: input.recipientType ?? 'tenant_admins',
      recipientId: input.recipientId ?? 'role_tenant_admin',
      notificationType: 'workflow.waiting_user_action',
      category: 'workflow',
      title: input.title,
      body: input.title,
      severity: input.severity === 'error' ? 'error' : input.severity === 'warning' ? 'warning' : 'info',
      sourceSystem: 'platform',
      sourceEventType: 'workflow.waiting_internal',
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      relatedWorkflowInstanceId: input.workflowInstanceId,
      actions: [],
      channels: ['in_app'],
      metadata: { correlationId: input.correlationId },
      sourceRefs: [],
      dedupeKey: `workflow:${input.workflowInstanceId}:notify`,
    });
    return { id: created[0]?.id ?? `notif_${crypto.randomUUID()}`, title: input.title, severity: input.severity };
  }
}
