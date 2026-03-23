import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import type { SupportEscalationCommandDto } from '@/lib/workflows/dto/command-dto';
import type { SupportEscalationResultDto } from '@/lib/workflows/dto/workflow-dto';
import type { WorkflowCommand } from '@/lib/workflows/types';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { WorkflowOrchestrationService } from './orchestration-service';
import { requireWorkflowAccess } from './workflow-policy';
import { WorkflowTaskNotificationHooks } from './task-notification-hooks';

export class SupportEscalationWorkflowService extends WorkflowOrchestrationService {
  private readonly adapters = getPlatformAdapters();
  private readonly hooks = new WorkflowTaskNotificationHooks();
  private readonly flags = new FeatureFlagService();

  async escalate(context: BffRequestContext, input: SupportEscalationCommandDto): Promise<SupportEscalationResultDto> {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: 'workflows' });
    if ((await this.flags.evaluateFlag('feature.kill_switch.workflows', featureContext)).enabled || !(await this.flags.evaluateFlag('feature.workflows.enabled', featureContext)).enabled) throw new WorkflowError({ code: 'workflow_disabled', message: 'Workflow execution is currently disabled.', status: 503, category: 'workflow_state_conflict' });
    requireWorkflowAccess(context, { moduleKey: 'support', resource: 'support_ticket', action: 'assign' });
    const command: WorkflowCommand<SupportEscalationCommandDto> = { commandId: `cmd_${crypto.randomUUID()}`, workflowType: 'support_escalation', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, initiatedBy: context.session.user.id, relatedEntityType: 'support_ticket', relatedEntityId: input.ticketId, payload: input, idempotencyKey: input.idempotencyKey, correlationId: context.correlationId, requestedAt: new Date().toISOString() };
    const existing = await this.registerCommand(command);
    if (existing) {
      const result = await this.resolveExistingIdempotentResult(existing);
      if (!result) throw new WorkflowError({ code: 'workflow_not_found', message: 'Existing workflow could not be resolved.', status: 404, category: 'duplicate_request' });
      return { ...result, ticketId: input.ticketId, escalationStatus: result.status, queue: input.targetQueue };
    }
    const ticket = await this.adapters.odoo.getSupportTicketById(input.ticketId, { correlationId: context.correlationId }).catch(() => null);
    if (!ticket) throw new WorkflowError({ code: 'support_ticket_not_found', message: 'Support ticket was not found.', status: 404, category: 'validation_failure' });
    if (!['open', 'pending'].includes(ticket.data.status)) throw new WorkflowError({ code: 'support_not_escalatable', message: 'Support ticket cannot be escalated from its current state.', status: 409, category: 'workflow_state_conflict' });

    const instance = await this.createWorkflowInstance(command, { severity: input.severity, targetQueue: input.targetQueue ?? 'ops_escalations' });
    const warnings: Array<{ code: string; message: string }> = [];
    await this.executeStep(instance, { stepKey: 'validate_case_state', stepType: 'validation', sequence: 1, run: async () => ({ output: { ticketStatus: ticket.data.status }, status: 'queued' }) });
    await this.executeStep(instance, { stepKey: 'record_escalation', stepType: 'platform_record', sequence: 2, run: async () => ({ output: { severity: input.severity, reason: input.escalationReason } }) });
    const task = await this.executeStep(instance, { stepKey: 'create_escalation_task', stepType: 'internal_task', sequence: 3, run: async () => ({ output: await this.hooks.createTask({ workflowInstanceId: instance.id, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, title: `Escalation for ${input.ticketId}`, queue: input.targetQueue ?? 'ops_escalations', relatedEntityType: 'support_ticket', relatedEntityId: input.ticketId, correlationId: context.correlationId }), status: 'waiting_internal' }) });
    await this.executeStep(instance, { stepKey: 'notify_stakeholders', stepType: 'automation', sequence: 4, sourceSystem: 'n8n', run: async () => {
      const execution = await this.adapters.n8n.triggerWorkflow('support-escalation', { ticketId: input.ticketId, severity: input.severity, targetQueue: input.targetQueue }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
      await this.hooks.createNotification({ workflowInstanceId: instance.id, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, title: `Ticket ${input.ticketId} escalated`, severity: input.severity === 'critical' ? 'error' : 'warning', relatedEntityType: 'support_ticket', relatedEntityId: input.ticketId, correlationId: context.correlationId });
      return { output: { executionId: execution.data.executionId }, sourceRefs: execution.data.executionId ? [{ sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: execution.data.executionId, syncedAt: execution.meta.receivedAt }] : [], status: 'waiting_internal' };
    } }).catch((error) => {
      warnings.push({ code: 'escalation_notification_failed', message: error instanceof Error ? error.message : 'Escalation notification failed.' });
      return { instance, output: undefined };
    });

    await this.completeWorkflow(instance, { ticketId: input.ticketId, queue: input.targetQueue ?? 'ops_escalations', taskId: (task.output as any)?.id, warnings }, warnings.length > 0 ? 'partially_completed' : 'waiting_internal');
    return { success: true, workflowInstanceId: instance.id, status: instance.status, nextStep: 'create_escalation_task', warnings, errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, ticketId: input.ticketId, escalationStatus: instance.status, queue: input.targetQueue ?? 'ops_escalations' };
  }
}
