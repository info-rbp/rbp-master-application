import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import type { ReviewApprovalActionCommandDto, ReviewApprovalStartCommandDto } from '@/lib/workflows/dto/command-dto';
import type { ReviewApprovalResultDto } from '@/lib/workflows/dto/workflow-dto';
import type { WorkflowCommand } from '@/lib/workflows/types';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { WorkflowOrchestrationService } from './orchestration-service';
import { requireWorkflowAccess } from './workflow-policy';
import { WorkflowTaskNotificationHooks } from './task-notification-hooks';

export class ReviewApprovalWorkflowService extends WorkflowOrchestrationService {
  private readonly adapters = getPlatformAdapters();
  private readonly hooks = new WorkflowTaskNotificationHooks();

  async start(context: BffRequestContext, input: ReviewApprovalStartCommandDto): Promise<ReviewApprovalResultDto> {
    requireWorkflowAccess(context, { moduleKey: input.relatedEntityType === 'invoice' ? 'finance' : input.relatedEntityType === 'support_ticket' ? 'support' : input.relatedEntityType === 'loan' ? 'loans' : 'applications', resource: input.relatedEntityType === 'invoice' ? 'finance' : input.relatedEntityType === 'support_ticket' ? 'support_ticket' : input.relatedEntityType, action: 'read' });
    const command: WorkflowCommand<ReviewApprovalStartCommandDto> = { commandId: `cmd_${crypto.randomUUID()}`, workflowType: 'review_approval', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, initiatedBy: context.session.user.id, relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId, payload: input, idempotencyKey: input.idempotencyKey, correlationId: context.correlationId, requestedAt: new Date().toISOString() };
    const existing = await this.registerCommand(command);
    if (existing) {
      const result = await this.resolveExistingIdempotentResult(existing);
      if (!result) throw new WorkflowError({ code: 'workflow_not_found', message: 'Existing workflow could not be resolved.', status: 404, category: 'duplicate_request' });
      return { ...result, approvalState: result.status, lastAction: 'deduplicated', nextRequiredActor: 'reviewer' };
    }

    const instance = await this.createWorkflowInstance(command, { reviewType: input.reviewType, requestedReviewers: input.requestedReviewers ?? [] });
    await this.executeStep(instance, { stepKey: 'validate_review_scope', stepType: 'validation', sequence: 1, run: async () => ({ output: { reviewType: input.reviewType }, status: 'queued' }) });
    const task = await this.executeStep(instance, { stepKey: 'assign_reviewer', stepType: 'internal_task', sequence: 2, run: async () => ({ output: await this.hooks.createTask({ workflowInstanceId: instance.id, title: `Review ${input.relatedEntityType} ${input.relatedEntityId}`, queue: 'approvals' }), status: 'waiting_internal' }) });
    await this.completeWorkflow(instance, { approvalState: 'pending_review', taskId: (task.output as any)?.id }, 'waiting_internal');
    return { success: true, workflowInstanceId: instance.id, status: 'waiting_internal', nextStep: 'assign_reviewer', warnings: [], errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, approvalState: 'pending_review', lastAction: 'start', nextRequiredActor: 'reviewer' };
  }

  async act(context: BffRequestContext, workflowId: string, input: ReviewApprovalActionCommandDto): Promise<ReviewApprovalResultDto> {
    requireWorkflowAccess(context, { moduleKey: 'applications', resource: 'application', action: input.action === 'approve' || input.action === 'reject' ? 'approve' : 'update' });
    const status = await this.getStatus(workflowId);
    if (!status) throw new WorkflowError({ code: 'workflow_not_found', message: 'Workflow was not found.', status: 404, category: 'validation_failure' });
    const instance = status.workflow;
    if (instance.workflowType !== 'review_approval') throw new WorkflowError({ code: 'workflow_type_mismatch', message: 'Workflow is not a review/approval workflow.', status: 409, category: 'workflow_state_conflict' });
    if (!['waiting_internal', 'partially_completed'].includes(instance.status)) throw new WorkflowError({ code: 'workflow_not_actionable', message: 'Workflow is not in an actionable state.', status: 409, category: 'workflow_state_conflict' });

    await this.executeStep(instance, { stepKey: `approval_${input.action}`, stepType: 'decision', sequence: status.steps.length + 1, run: async () => {
      if (instance.relatedEntityType === 'application' && (input.action === 'approve' || input.action === 'reject')) {
        await this.adapters.lending.updateApplicationStatus(instance.relatedEntityId, { status: input.action === 'approve' ? 'approved' : 'rejected', reason: input.comment }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
      }
      return { output: { action: input.action, assigneeId: input.assigneeId, comment: input.comment }, status: input.action === 'request_more_information' || input.action === 'assign' || input.action === 'escalate' ? 'waiting_internal' : input.action === 'cancel' ? 'cancelled' : 'completed' };
    } });

    const finalStatus = input.action === 'request_more_information' || input.action === 'assign' || input.action === 'escalate' ? 'waiting_internal' : input.action === 'cancel' ? 'cancelled' : 'completed';
    await this.completeWorkflow(instance, { lastAction: input.action, comment: input.comment }, finalStatus);
    return { success: true, workflowInstanceId: instance.id, status: finalStatus, nextStep: instance.currentStep, warnings: [], errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, approvalState: finalStatus, lastAction: input.action, nextRequiredActor: finalStatus === 'waiting_internal' ? 'reviewer' : undefined };
  }
}
