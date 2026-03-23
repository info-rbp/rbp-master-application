import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';
import type { DocumentUploadCommandDto } from '@/lib/workflows/dto/command-dto';
import type { DocumentUploadResultDto } from '@/lib/workflows/dto/workflow-dto';
import type { WorkflowCommand } from '@/lib/workflows/types';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { WorkflowOrchestrationService } from './orchestration-service';
import { requireWorkflowAccess } from './workflow-policy';
import { WorkflowTaskNotificationHooks } from './task-notification-hooks';

export class DocumentUploadWorkflowService extends WorkflowOrchestrationService {
  private readonly adapters = getPlatformAdapters();
  private readonly hooks = new WorkflowTaskNotificationHooks();
  private readonly flags = new FeatureFlagService();

  async registerUpload(context: BffRequestContext, input: DocumentUploadCommandDto): Promise<DocumentUploadResultDto> {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: 'workflows' });
    if ((await this.flags.evaluateFlag('feature.kill_switch.workflows', featureContext)).enabled || !(await this.flags.evaluateFlag('feature.workflows.enabled', featureContext)).enabled) throw new WorkflowError({ code: 'workflow_disabled', message: 'Workflow execution is currently disabled.', status: 503, category: 'workflow_state_conflict' });
    requireWorkflowAccess(context, { moduleKey: 'documents', resource: 'document', action: 'create' });
    const command: WorkflowCommand<DocumentUploadCommandDto> = { commandId: `cmd_${crypto.randomUUID()}`, workflowType: 'document_upload', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, initiatedBy: context.session.user.id, relatedEntityType: input.ownerEntityType, relatedEntityId: input.ownerEntityId, payload: input, idempotencyKey: input.idempotencyKey, correlationId: context.correlationId, requestedAt: new Date().toISOString() };
    const existing = await this.registerCommand(command);
    if (existing) {
      const result = await this.resolveExistingIdempotentResult(existing);
      if (!result) throw new WorkflowError({ code: 'workflow_not_found', message: 'Existing workflow could not be resolved.', status: 404, category: 'duplicate_request' });
      return { ...result, documentId: existing.workflowInstanceId, documentStatus: result.status, linkedEntity: { type: input.ownerEntityType, id: input.ownerEntityId } };
    }

    await this.validateTarget(input);
    const instance = await this.createWorkflowInstance(command, { fileName: input.fileName, documentType: input.documentType });
    const warnings: Array<{ code: string; message: string }> = [];
    const documentId = `doc_${crypto.randomUUID()}`;

    await this.executeStep(instance, { stepKey: 'validate_target_entity', stepType: 'validation', sequence: 1, run: async () => ({ output: { ownerEntityId: input.ownerEntityId }, status: 'queued' }) });
    await this.executeStep(instance, { stepKey: 'register_document', stepType: 'platform_record', sequence: 2, sourceSystem: 'platform', run: async () => ({ output: { documentId, storageReference: input.storageReference }, sourceRefs: [{ sourceSystem: 'platform', sourceRecordType: 'document', sourceRecordId: documentId, syncedAt: new Date().toISOString() }] }) });
    await this.executeStep(instance, { stepKey: 'trigger_document_automation', stepType: 'automation', sequence: 3, sourceSystem: 'n8n', run: async () => {
      const execution = await this.adapters.n8n.triggerWorkflow('document-upload', { documentId, ownerEntityType: input.ownerEntityType, ownerEntityId: input.ownerEntityId, classificationHints: input.classificationHints ?? [] }, { correlationId: context.correlationId, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actingUserId: context.session.user.id });
      return { output: { executionId: execution.data.executionId }, sourceRefs: execution.data.executionId ? [{ sourceSystem: 'n8n', sourceRecordType: 'execution', sourceRecordId: execution.data.executionId, syncedAt: execution.meta.receivedAt }] : [], status: 'waiting_internal' };
    } }).catch((error) => {
      warnings.push({ code: 'document_automation_failed', message: error instanceof Error ? error.message : 'Document automation failed.' });
      return { instance, output: undefined };
    });

    const task = await this.executeStep(instance, { stepKey: 'create_review_task', stepType: 'internal_task', sequence: 4, run: async () => {
      const task = await this.hooks.createTask({ workflowInstanceId: instance.id, tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, title: `Review ${input.documentType} for ${input.ownerEntityType} ${input.ownerEntityId}`, queue: 'document_review', relatedEntityType: input.ownerEntityType, relatedEntityId: input.ownerEntityId, correlationId: context.correlationId });
      return { output: { taskId: task.id }, status: 'waiting_internal' };
    } });

    await this.completeWorkflow(instance, { documentId, documentStatus: 'registered', linkedEntity: { type: input.ownerEntityType, id: input.ownerEntityId }, taskId: task.output?.taskId, warnings }, 'waiting_internal');
    return { success: true, workflowInstanceId: instance.id, status: 'waiting_internal', nextStep: 'create_review_task', warnings, errors: [], sourceRefs: instance.sourceSystemRefs, meta: { correlationId: context.correlationId }, documentId, documentStatus: 'registered', linkedEntity: { type: input.ownerEntityType, id: input.ownerEntityId } };
  }

  private async validateTarget(input: DocumentUploadCommandDto) {
    const ctx = { correlationId: 'validation' };
    if (input.ownerEntityType === 'application') {
      const application = await this.adapters.lending.getApplicationById(input.ownerEntityId, ctx).catch(() => null);
      if (!application) throw new WorkflowError({ code: 'document_target_not_found', message: 'Application target not found.', status: 404, category: 'validation_failure' });
      return;
    }
    if (input.ownerEntityType === 'loan') {
      const loan = await this.adapters.lending.getLoanById(input.ownerEntityId, ctx).catch(() => null);
      if (!loan) throw new WorkflowError({ code: 'document_target_not_found', message: 'Loan target not found.', status: 404, category: 'validation_failure' });
      return;
    }
    if (input.ownerEntityType === 'customer') {
      const customer = await this.adapters.odoo.getCustomerById(input.ownerEntityId, ctx).catch(() => null);
      if (!customer) throw new WorkflowError({ code: 'document_target_not_found', message: 'Customer target not found.', status: 404, category: 'validation_failure' });
      return;
    }
    const ticket = await this.adapters.odoo.getSupportTicketById(input.ownerEntityId, ctx).catch(() => null);
    if (!ticket) throw new WorkflowError({ code: 'document_target_not_found', message: 'Support target not found.', status: 404, category: 'validation_failure' });
  }
}
