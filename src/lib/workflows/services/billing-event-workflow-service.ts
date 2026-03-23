import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import type { BillingEventCommandDto } from '@/lib/workflows/dto/command-dto';
import type { BillingEventResultDto } from '@/lib/workflows/dto/workflow-dto';
import type { WorkflowCommand } from '@/lib/workflows/types';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { WorkflowOrchestrationService } from './orchestration-service';
import { requireWorkflowAccess } from './workflow-policy';
import { WorkflowTaskNotificationHooks } from './task-notification-hooks';

const supportedEventTypes = new Set(['invoice_issued', 'invoice_overdue', 'payment_received', 'payment_failed']);

export class BillingEventWorkflowService extends WorkflowOrchestrationService {
  private readonly adapters = getPlatformAdapters();
  private readonly hooks = new WorkflowTaskNotificationHooks();
  private readonly flags = new FeatureFlagService();

  async process(context: BffRequestContext, input: BillingEventCommandDto): Promise<BillingEventResultDto> {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: 'workflows' });
    if ((await this.flags.evaluateFlag('feature.kill_switch.workflows', featureContext)).enabled || !(await this.flags.evaluateFlag('feature.workflows.enabled', featureContext)).enabled) throw new WorkflowError({ code: 'workflow_disabled', message: 'Workflow execution is currently disabled.', status: 503, category: 'workflow_state_conflict' });
    requireWorkflowAccess(context, { moduleKey: 'finance', resource: 'finance', action: 'manage' });
    if (!supportedEventTypes.has(input.eventType)) throw new WorkflowError({ code: 'billing_event_unsupported', message: 'Unsupported billing event type.', status: 400, category: 'validation_failure' });
    const command: WorkflowCommand<BillingEventCommandDto> = { commandId: `cmd_${crypto.randomUUID()}`, workflowType: 'billing_event', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, initiatedBy: context.session.user.id, relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId, payload: input, idempotencyKey: input.idempotencyKey, correlationId: context.correlationId, requestedAt: new Date().toISOString() };
    const existing = await this.registerCommand(command);
    if (existing) {
      const result = await this.resolveExistingIdempotentResult(existing);
      if (!result) throw new WorkflowError({ code: 'workflow_not_found', message: 'Existing workflow could not be resolved.', status: 404, category: 'duplicate_request' });
      return { ...result, eventType: input.eventType, relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId };
    }

    if (input.relatedEntityType === 'invoice') {
      const invoice = await this.adapters.odoo.getInvoiceById(input.relatedEntityId, { correlationId: context.correlationId }).catch(() => null);
      if (!invoice) throw new WorkflowError({ code: 'billing_entity_not_found', message: 'Invoice was not found.', status: 404, category: 'validation_failure' });
    }

    const instance = await this.createWorkflowInstance(command, { eventPayload: input.eventPayload, eventType: input.eventType });
    const warnings: Array<{ code: string; message: string }> = [];
    await this.executeStep(instance, { stepKey: 'validate_billing_event', stepType: 'validation', sequence: 1, run: async () => ({ output: { eventType: input.eventType }, status: 'queued' }) });
    await this.executeStep(instance, { stepKey: 'record_billing_event', stepType: 'platform_record', sequence: 2, run: async () => ({ output: { relatedEntityId: input.relatedEntityId } }) });
    if (input.eventType === 'invoice_overdue' || input.eventType === 'payment_failed') {
      const task = await this.executeStep(instance, { stepKey: 'create_finance_task', stepType: 'internal_task', sequence: 3, run: async () => ({ output: await this.hooks.createTask({ workflowInstanceId: instance.id, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, title: `${input.eventType} for ${input.relatedEntityId}`, queue: 'finance_ops', relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId, correlationId: context.correlationId }), status: 'waiting_internal' }) });
      const n8nEnabled = await this.flags.evaluateFlag('feature.integration.n8n.workflow_dispatch_enabled', featureContext);
      if (n8nEnabled.enabled) await this.executeStep(instance, { stepKey: 'trigger_finance_automation', stepType: 'automation', sequence: 4, sourceSystem: 'n8n', run: async () => {
        const execution = await this.adapters.n8n.triggerWorkflow('billing-event', { eventType: input.eventType, relatedEntityId: input.relatedEntityId }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
        return { output: { executionId: execution.data.executionId, taskId: (task.output as any)?.id }, sourceRefs: execution.data.executionId ? [{ sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: execution.data.executionId, syncedAt: execution.meta.receivedAt }] : [], status: 'waiting_internal' };
      } }).catch((error) => {
        warnings.push({ code: 'billing_automation_failed', message: error instanceof Error ? error.message : 'Billing automation failed.' });
        return { instance, output: undefined };
      });
      await this.completeWorkflow(instance, { eventType: input.eventType, taskCreated: true, warnings }, warnings.length > 0 ? 'partially_completed' : 'waiting_internal');
    } else {
      await this.completeWorkflow(instance, { eventType: input.eventType, taskCreated: false }, 'completed');
    }

    return { success: true, workflowInstanceId: instance.id, status: instance.status, nextStep: instance.currentStep, warnings, errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, eventType: input.eventType, relatedEntityType: input.relatedEntityType, relatedEntityId: input.relatedEntityId };
  }
}
