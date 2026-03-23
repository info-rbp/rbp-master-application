import { NotificationService } from '@/lib/notifications-center/service';
import { getTaskStore } from '@/lib/tasks/store';
import type { TaskRecord } from '@/lib/tasks/types';
import { AuditService } from '@/lib/audit/service';

export type CreatedTask = { id: string; title: string; queue?: string; status: 'open' | 'pending' | 'completed' };
export type CreatedNotification = { id: string; title: string; severity: 'info' | 'warning' | 'error' };

function moduleForQueue(queue?: string): TaskRecord['moduleKey'] {
  if (queue?.includes('finance')) return 'finance';
  if (queue?.includes('document')) return 'documents';
  if (queue?.includes('support') || queue?.includes('ops')) return 'support';
  return 'applications';
}

export class WorkflowTaskNotificationHooks {
  private readonly notifications = new NotificationService();
  private readonly tasks = getTaskStore();
  private readonly audit = new AuditService();

  async createTask(input: { workflowInstanceId: string; tenantId?: string; workspaceId?: string; title: string; queue?: string; relatedEntityType?: string; relatedEntityId?: string; correlationId?: string }) : Promise<CreatedTask> {
    const task: TaskRecord = {
      id: `task_${crypto.randomUUID()}`,
      taskType: 'workflow_review',
      title: input.title,
      tenantId: input.tenantId ?? 'ten_rbp_internal',
      workspaceId: input.workspaceId,
      status: 'open',
      priority: input.queue?.includes('finance') ? 'urgent' : input.queue?.includes('ops') ? 'high' : 'normal',
      urgencyScore: input.queue?.includes('finance') ? 84 : 60,
      sourceSystem: 'platform',
      sourceTaskType: 'workflow',
      relatedEntityType: input.relatedEntityType ?? 'workflow',
      relatedEntityId: input.relatedEntityId ?? input.workflowInstanceId,
      assigneeType: 'queue',
      assigneeId: input.queue,
      assigneeDisplay: input.queue,
      queue: input.queue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      availableActions: [
        { key: 'open', label: 'Open', type: 'navigate', enabled: true, requiresConfirmation: false, route: `/tasks?task=${encodeURIComponent(input.workflowInstanceId)}` },
        { key: 'assign', label: 'Assign', type: 'assign', enabled: true, requiresConfirmation: false, apiAction: 'assign' },
        { key: 'complete', label: 'Complete', type: 'complete', enabled: true, requiresConfirmation: true, apiAction: 'complete' },
      ],
      warnings: [],
      metadata: { workflowInstanceId: input.workflowInstanceId },
      moduleKey: moduleForQueue(input.queue),
    };
    await this.tasks.saveTask(task);
    await this.audit.record({ eventType: 'task.created', action: 'create', category: 'workflow', tenantId: task.tenantId, workspaceId: task.workspaceId, actorType: 'workflow', actorId: input.workflowInstanceId, subjectEntityType: 'task', subjectEntityId: task.id, targetEntityType: task.relatedEntityType, targetEntityId: task.relatedEntityId, relatedEntityRefs: [{ entityType: 'workflow', entityId: input.workflowInstanceId }], sourceSystem: 'platform', correlationId: input.correlationId ?? crypto.randomUUID(), outcome: 'success', severity: 'info', metadata: { queue: task.queue }, sensitivity: 'internal' });
    return { id: task.id, title: input.title, queue: input.queue, status: 'open' };
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
      actions: [{ key: 'open_task_inbox', label: 'Open tasks', type: 'navigate', route: '/tasks', requiresConfirmation: false, isPrimary: true, enabled: true }],
      channels: ['in_app'],
      metadata: { correlationId: input.correlationId },
      sourceRefs: [],
      dedupeKey: `workflow:${input.workflowInstanceId}:notify`,
    });
    return { id: created[0]?.id ?? `notif_${crypto.randomUUID()}`, title: input.title, severity: input.severity };
  }
}
