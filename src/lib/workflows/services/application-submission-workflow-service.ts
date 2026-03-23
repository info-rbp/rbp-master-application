import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import type { ApplicationSubmissionCommandDto } from '@/lib/workflows/dto/command-dto';
import type { ApplicationSubmissionResultDto } from '@/lib/workflows/dto/workflow-dto';
import type { WorkflowCommand } from '@/lib/workflows/types';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { WorkflowOrchestrationService } from './orchestration-service';
import { requireWorkflowAccess } from './workflow-policy';
import { WorkflowTaskNotificationHooks } from './task-notification-hooks';

export class ApplicationSubmissionWorkflowService extends WorkflowOrchestrationService {
  private readonly adapters = getPlatformAdapters();
  private readonly hooks = new WorkflowTaskNotificationHooks();

  async submit(context: BffRequestContext, input: ApplicationSubmissionCommandDto): Promise<ApplicationSubmissionResultDto> {
    requireWorkflowAccess(context, { moduleKey: 'applications', resource: 'application', action: 'update' });
    const command: WorkflowCommand<ApplicationSubmissionCommandDto> = {
      commandId: `cmd_${crypto.randomUUID()}`,
      workflowType: 'application_submission',
      tenantId: context.session.activeTenant.id,
      workspaceId: context.session.activeWorkspace?.id,
      initiatedBy: context.session.user.id,
      relatedEntityType: 'application',
      relatedEntityId: input.applicationId,
      payload: input,
      idempotencyKey: input.idempotencyKey,
      correlationId: context.correlationId,
      requestedAt: new Date().toISOString(),
    };
    const existing = await this.registerCommand(command);
    if (existing) {
      const result = await this.resolveExistingIdempotentResult(existing);
      if (!result) throw new WorkflowError({ code: 'workflow_not_found', message: 'Existing workflow could not be resolved.', status: 404, category: 'duplicate_request' });
      return { ...result, applicationId: input.applicationId, applicationStatus: result.status, decisionSummary: undefined };
    }

    const applicationEnvelope = await this.adapters.lending.getApplicationById(input.applicationId, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id }).catch(() => null);
    if (!applicationEnvelope) throw new WorkflowError({ code: 'application_not_found', message: 'Application was not found.', status: 404, category: 'validation_failure' });
    if (['approved', 'rejected', 'active'].includes(applicationEnvelope.data.status)) throw new WorkflowError({ code: 'application_not_submittable', message: 'Application is not in a submittable state.', status: 409, category: 'workflow_state_conflict' });

    const instance = await this.createWorkflowInstance(command, { submitOptions: input.submitOptions ?? {} });
    const warnings: Array<{ code: string; message: string }> = [];
    const sourceRefs = [] as ApplicationSubmissionResultDto['sourceRefs'];

    await this.executeStep(instance, { stepKey: 'validate_request', stepType: 'validation', sequence: 1, run: async () => ({ output: { applicationId: input.applicationId }, status: 'queued' }) });
    const submission = await this.executeStep(instance, { stepKey: 'submit_to_lending', stepType: 'adapter_call', sequence: 2, sourceSystem: 'lending', run: async () => {
      const updated = await this.adapters.lending.updateApplicationStatus(input.applicationId, { status: 'submitted' }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
      return { output: { applicationStatus: updated.data.status }, sourceRefs: [{ sourceSystem: 'lending', sourceRecordType: 'application', sourceRecordId: updated.data.id, syncedAt: updated.meta.receivedAt }] };
    } });
    sourceRefs.push(...(submission.instance.sourceSystemRefs));

    let decisionSummary: Record<string, unknown> | undefined;
    try {
      const risk = await this.executeStep(instance, { stepKey: 'evaluate_risk', stepType: 'adapter_call', sequence: 3, sourceSystem: 'marble', run: async () => {
        const result = await this.adapters.marble.evaluateSubject({ subjectId: input.applicationId, subjectType: 'application' }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
        decisionSummary = { decisionId: result.data.id, outcome: result.data.outcome, reasonCodes: result.data.reasonCodes };
        return { output: decisionSummary, sourceRefs: [{ sourceSystem: 'marble', sourceRecordType: 'decision', sourceRecordId: result.data.id, syncedAt: result.meta.receivedAt }] };
      } });
      sourceRefs.push(...risk.instance.sourceSystemRefs);
    } catch (error) {
      warnings.push({ code: 'risk_evaluation_failed', message: error instanceof Error ? error.message : 'Risk evaluation failed.' });
      instance.status = 'partially_completed';
      await this.store.saveInstance(instance);
    }

    const automation = await this.executeStep(instance, { stepKey: 'trigger_automation', stepType: 'automation', sequence: 4, sourceSystem: 'n8n', run: async () => {
      const response = await this.adapters.n8n.triggerWorkflow('application-submission', { applicationId: input.applicationId }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
      return { output: { executionId: response.data.executionId, accepted: response.data.accepted }, sourceRefs: [{ sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: response.data.executionId ?? 'pending', syncedAt: response.meta.receivedAt }], status: response.data.accepted ? 'waiting_internal' : 'partially_completed' };
    } }).catch((error) => {
      warnings.push({ code: 'automation_failed', message: error instanceof Error ? error.message : 'Automation trigger failed.' });
      return { instance, output: undefined };
    });
    sourceRefs.push(...automation.instance.sourceSystemRefs);

    const task = await this.executeStep(instance, { stepKey: 'create_review_task', stepType: 'internal_task', sequence: 5, run: async () => {
      const createdTask = await this.hooks.createTask({ workflowInstanceId: instance.id, title: `Review application ${input.applicationId}`, queue: 'credit_review' });
      await this.hooks.createNotification({ workflowInstanceId: instance.id, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, title: `Application ${input.applicationId} submitted`, severity: 'info', relatedEntityType: 'application', relatedEntityId: input.applicationId, correlationId: context.correlationId });
      return { output: { taskId: createdTask.id }, status: warnings.length > 0 ? 'partially_completed' : 'completed' };
    } });

    await this.completeWorkflow(instance, { applicationId: input.applicationId, applicationStatus: 'submitted', decisionSummary, taskId: task.output?.taskId, warnings }, warnings.length > 0 ? 'partially_completed' : 'completed');
    return { success: true, workflowInstanceId: instance.id, status: instance.status, nextStep: instance.currentStep, warnings, errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, applicationId: input.applicationId, applicationStatus: 'submitted', decisionSummary };
  }
}
