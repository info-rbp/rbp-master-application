import { BffApiError, type BffRequestContext } from '@/lib/bff/utils/request-context';
import type { WarningDto } from '@/lib/bff/dto/common';
import { canAccessTaskModule } from '@/lib/tasks/access';
import { InternalTaskProvider } from '@/lib/tasks/providers/internal-task-provider';
import { WorkflowTaskProvider } from '@/lib/tasks/providers/workflow-task-provider';
import { LendingTaskProvider } from '@/lib/tasks/providers/lending-task-provider';
import { MarbleTaskProvider } from '@/lib/tasks/providers/marble-task-provider';
import { OdooTaskProvider } from '@/lib/tasks/providers/odoo-task-provider';
import type { TaskActionResult, TaskListResponse, TaskProvider, TaskQuery, TaskRecord, TaskSummary } from '@/lib/tasks/types';
import { AuditService } from '@/lib/audit/service';
import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import { NotificationService } from '@/lib/notifications-center/service';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { getTaskStore } from '@/lib/tasks/store';
import { ReviewApprovalWorkflowService } from '@/lib/workflows/services/review-approval-workflow-service';

function compareTasks(a: TaskRecord, b: TaskRecord) {
  const overdueA = a.dueAt && new Date(a.dueAt).getTime() < Date.now() ? 1 : 0;
  const overdueB = b.dueAt && new Date(b.dueAt).getTime() < Date.now() ? 1 : 0;
  const priorityOrder = { critical: 5, urgent: 4, high: 3, normal: 2, low: 1 } as const;
  const mineA = a.assigneeId ? Number(a.assigneeId === (a.metadata.currentUserId as string | undefined)) : 0;
  const mineB = b.assigneeId ? Number(b.assigneeId === (b.metadata.currentUserId as string | undefined)) : 0;
  return overdueB - overdueA || priorityOrder[b.priority] - priorityOrder[a.priority] || mineB - mineA || String(a.dueAt ?? '').localeCompare(String(b.dueAt ?? '')) || String(b.createdAt).localeCompare(String(a.createdAt));
}

function buildSummary(items: TaskRecord[], userId: string): TaskSummary {
  return {
    totalOpen: items.filter((item) => !['completed', 'cancelled'].includes(item.status)).length,
    overdue: items.filter((item) => item.dueAt && new Date(item.dueAt).getTime() < Date.now() && !['completed', 'cancelled'].includes(item.status)).length,
    highPriority: items.filter((item) => ['high', 'urgent', 'critical'].includes(item.priority)).length,
    byStatus: items.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] ?? 0) + 1 }), {} as TaskSummary['byStatus']),
    byPriority: items.reduce((acc, item) => ({ ...acc, [item.priority]: (acc[item.priority] ?? 0) + 1 }), {} as TaskSummary['byPriority']),
    bySourceSystem: items.reduce((acc, item) => ({ ...acc, [item.sourceSystem]: (acc[item.sourceSystem] ?? 0) + 1 }), {} as Record<string, number>),
    byModule: items.reduce((acc, item) => ({ ...acc, [item.moduleKey]: (acc[item.moduleKey] ?? 0) + 1 }), {} as TaskSummary['byModule']),
    requiresMyAttention: items.filter((item) => item.assigneeId === userId || item.assigneeType === 'tenant_admins').length,
  };
}

const taskActionPolicies: Record<string, string> = { assign: 'tasks.assign', complete: 'tasks.complete', approve: 'workflows.review.approve', reject: 'tasks.reject', request_info: 'tasks.request_info', escalate: 'tasks.escalate' };

export class TaskService {
  private readonly providers: TaskProvider[] = [new InternalTaskProvider(), new WorkflowTaskProvider(), new LendingTaskProvider(), new MarbleTaskProvider(), new OdooTaskProvider()];
  private readonly audit = new AuditService();
  private readonly featureFlags = new FeatureFlagService();
  private readonly notifications = new NotificationService();
  private readonly store = getTaskStore();
  private readonly reviewApproval = new ReviewApprovalWorkflowService();

  private buildQuery(context: BffRequestContext, filters: Record<string, unknown>): TaskQuery {
    return {
      tenantId: context.session.activeTenant.id,
      workspaceId: context.session.activeWorkspace?.id,
      userId: context.session.user.id,
      internalUser: context.internalUser,
      page: Number(filters.page ?? 1),
      pageSize: Math.min(50, Math.max(1, Number(filters.pageSize ?? filters.limit ?? 20))),
      search: typeof filters.search === 'string' ? filters.search : undefined,
      status: typeof filters.status === 'string' ? filters.status as any : undefined,
      priority: typeof filters.priority === 'string' ? filters.priority as any : undefined,
      sourceSystem: typeof filters.sourceSystem === 'string' ? filters.sourceSystem : undefined,
      queue: typeof filters.queue === 'string' ? filters.queue : undefined,
      assignment: typeof filters.assignment === 'string' ? filters.assignment as any : 'mine',
      relatedEntityType: typeof filters.relatedEntityType === 'string' ? filters.relatedEntityType : undefined,
      relatedEntityId: typeof filters.relatedEntityId === 'string' ? filters.relatedEntityId : undefined,
      correlationId: context.correlationId,
    };
  }

  async listTasks(context: BffRequestContext, filters: Record<string, unknown> = {}): Promise<TaskListResponse> {
    const killSwitch = await this.featureFlags.evaluateFlag('feature.kill_switch.tasks', buildFeatureEvaluationContext(context));
    if (killSwitch.enabled) throw new BffApiError('tasks_kill_switch_active', 'Tasks are temporarily disabled by kill switch.', 503);
    await requireActionPolicyAccess('tasks.list', context);
    const query = this.buildQuery(context, filters);
    const warnings: WarningDto[] = [];
    const providerResults = await Promise.all(this.providers.map(async (provider) => {
      try {
        const result = await provider.listTasks(query);
        return result.items.map((item) => ({ ...item, metadata: { ...item.metadata, currentUserId: context.session.user.id } }));
      } catch (error) {
        warnings.push({ code: `${provider.key}_tasks_unavailable`, message: error instanceof Error ? error.message : 'Task source unavailable.', sourceSystem: provider.key as any, retryable: true });
        return [];
      }
    }));

    const items = providerResults.flat()
      .filter((item) => canAccessTaskModule(context, item.moduleKey))
      .filter((item) => !query.sourceSystem || item.sourceSystem === query.sourceSystem)
      .sort(compareTasks);
    const offset = (query.page - 1) * query.pageSize;
    const pageItems = items.slice(offset, offset + query.pageSize);
    return {
      items: pageItems,
      summary: buildSummary(items, context.session.user.id),
      page: query.page,
      pageSize: query.pageSize,
      total: items.length,
      hasMore: offset + query.pageSize < items.length,
      filters: { status: query.status, priority: query.priority, sourceSystem: query.sourceSystem, assignment: query.assignment, queue: query.queue },
      warnings,
      meta: { degraded: warnings.length > 0 },
    };
  }

  async getTaskById(context: BffRequestContext, taskId: string) {
    await requireActionPolicyAccess('tasks.list', context);
    for (const provider of this.providers) {
      const task = await provider.getTaskById(taskId, { tenantId: context.session.activeTenant.id, userId: context.session.user.id, internalUser: context.internalUser, correlationId: context.correlationId });
      if (task && canAccessTaskModule(context, task.moduleKey)) return task;
    }
    return null;
  }

  async performAction(context: BffRequestContext, taskId: string, action: string, payload: Record<string, unknown> = {}): Promise<TaskActionResult> {
    const task = await this.getTaskById(context, taskId);
    if (!task) throw new BffApiError('task_not_found', 'Task not found.', 404);
    const provider = this.providers.find((entry) => entry.supportsAction(task, action, { tenantId: context.session.activeTenant.id, userId: context.session.user.id, internalUser: context.internalUser, correlationId: context.correlationId }));
    if (!provider) throw new BffApiError('task_action_unsupported', 'This task action is not supported.', 400, { taskId, action });

    const actionPolicyKey = taskActionPolicies[action];
    if (actionPolicyKey) await requireActionPolicyAccess(actionPolicyKey, context);

    let result: TaskActionResult;
    if (task.id.startsWith('workflow:') && ['approve', 'reject', 'complete'].includes(action)) {
      const workflowId = String(task.metadata.workflowInstanceId);
      if (task.metadata.workflowType === 'review_approval' && ['approve', 'reject'].includes(action)) {
        const acted = await this.reviewApproval.act(context, workflowId, { action: action as any, comment: typeof payload.comment === 'string' ? payload.comment : undefined });
        result = { success: true, action, warnings: [], meta: { workflowInstanceId: acted.workflowInstanceId, workflowStatus: acted.status }, task: await this.getTaskById(context, taskId) };
      } else {
        result = { success: true, action, warnings: [], meta: { workflowInstanceId: workflowId, routedTo: 'workflow' }, task };
      }
    } else if (task.sourceSystem === 'platform') {
      result = await this.performPlatformAction(context, task, action, payload);
    } else {
      result = { success: true, action, warnings: [], meta: { routedTo: provider.key }, task };
    }

    await this.audit.record({ eventType: `task.${action}`, action, category: 'workflow', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'task', subjectEntityId: task.id, targetEntityType: task.relatedEntityType, targetEntityId: task.relatedEntityId, relatedEntityRefs: [{ entityType: task.relatedEntityType, entityId: task.relatedEntityId }], sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: ['reject', 'escalate'].includes(action) ? 'warning' : 'info', metadata: payload, sensitivity: 'internal' });
    return result;
  }

  private async performPlatformAction(context: BffRequestContext, task: TaskRecord, action: string, payload: Record<string, unknown>) {
    const current = await this.store.getTask(task.id);
    if (!current) throw new BffApiError('task_not_found', 'Task not found.', 404);
    if (action === 'assign') {
      current.assigneeType = 'user';
      current.assigneeId = typeof payload.assigneeId === 'string' ? payload.assigneeId : context.session.user.id;
      current.assigneeDisplay = current.assigneeId === context.session.user.id ? context.session.user.displayName : current.assigneeId;
      current.status = 'in_progress';
      current.updatedAt = new Date().toISOString();
      await this.store.saveTask(current);
      await this.notifications.create({ tenantId: current.tenantId, workspaceId: current.workspaceId, recipientType: 'user', recipientId: current.assigneeId, notificationType: 'task.assigned', category: 'workflow', title: current.title, body: `Assigned task ${current.id}`, severity: 'info', sourceSystem: 'platform', sourceEventType: 'task.assigned', relatedEntityType: current.relatedEntityType, relatedEntityId: current.relatedEntityId, relatedWorkflowInstanceId: typeof current.metadata.workflowInstanceId === 'string' ? current.metadata.workflowInstanceId : undefined, actions: [{ key: 'open_task', label: 'Open task', type: 'navigate', route: `/tasks?task=${encodeURIComponent(current.id)}`, requiresConfirmation: false, isPrimary: true, enabled: true }], channels: ['in_app'], metadata: { correlationId: context.correlationId }, sourceRefs: [], dedupeKey: `task:assigned:${current.id}:${current.assigneeId}` });
      return { success: true, action, warnings: [], meta: { assignedTo: current.assigneeId }, task: current };
    }
    if (['complete', 'approve'].includes(action)) {
      current.status = 'completed';
      current.completedAt = new Date().toISOString();
      current.updatedAt = current.completedAt;
      await this.store.saveTask(current);
      return { success: true, action, warnings: [], meta: { completed: true }, task: current };
    }
    if (action === 'reject') {
      current.status = 'blocked';
      current.updatedAt = new Date().toISOString();
      await this.store.saveTask(current);
      return { success: true, action, warnings: [], meta: { rejected: true }, task: current };
    }
    if (action === 'request_info') {
      current.status = 'waiting_external';
      current.updatedAt = new Date().toISOString();
      await this.store.saveTask(current);
      return { success: true, action, warnings: [], meta: { requestedInfo: true }, task: current };
    }
    if (action === 'escalate') {
      current.priority = 'critical';
      current.updatedAt = new Date().toISOString();
      await this.store.saveTask(current);
      await this.notifications.create({ tenantId: current.tenantId, workspaceId: current.workspaceId, recipientType: 'tenant_admins', recipientId: 'role_tenant_admin', notificationType: 'task.escalated', category: 'workflow', title: `Escalated task ${current.title}`, body: current.description ?? current.title, severity: 'warning', sourceSystem: 'platform', sourceEventType: 'task.escalated', relatedEntityType: current.relatedEntityType, relatedEntityId: current.relatedEntityId, relatedWorkflowInstanceId: typeof current.metadata.workflowInstanceId === 'string' ? current.metadata.workflowInstanceId : undefined, actions: [{ key: 'open_task', label: 'Open task', type: 'navigate', route: `/tasks?task=${encodeURIComponent(current.id)}`, requiresConfirmation: false, isPrimary: true, enabled: true }], channels: ['in_app'], metadata: { correlationId: context.correlationId }, sourceRefs: [], dedupeKey: `task:escalated:${current.id}` });
      return { success: true, action, warnings: [], meta: { escalated: true }, task: current };
    }
    throw new BffApiError('task_action_unsupported', 'Unsupported task action.', 400, { action });
  }
}
