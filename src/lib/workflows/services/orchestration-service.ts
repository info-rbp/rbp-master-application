import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';
import { WorkflowEventPublisher } from '@/lib/workflows/services/publisher';
import { hashRequest } from '@/lib/workflows/utils/hash';
import { classifyUnknownFailure, WorkflowError } from '@/lib/workflows/utils/errors';
import type { IdempotencyRecord, WorkflowActionResult, WorkflowCommand, WorkflowEvent, WorkflowFailureCategory, WorkflowInstance, WorkflowSourceRef, WorkflowStatus, WorkflowStepExecution, WorkflowType } from '@/lib/workflows/types';

export class WorkflowOrchestrationService {
  protected readonly store = getWorkflowStore();
  protected readonly publisher = new WorkflowEventPublisher();

  protected now() { return new Date().toISOString(); }

  async getStatus(workflowId: string) {
    return this.store.getWorkflowStatus(workflowId);
  }

  protected async registerCommand<TPayload>(command: WorkflowCommand<TPayload>) {
    if (!command.idempotencyKey) return null;
    const requestHash = hashRequest(command.payload);
    const existing = await this.store.findIdempotencyRecord({ idempotencyKey: command.idempotencyKey, workflowType: command.workflowType, tenantId: command.tenantId });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new WorkflowError({ code: 'workflow_idempotency_conflict', message: 'The supplied idempotency key has already been used with a different request.', status: 409, category: 'duplicate_request', details: { workflowInstanceId: existing.workflowInstanceId } });
      }
      return existing;
    }
    return null;
  }

  protected async createWorkflowInstance<TPayload>(command: WorkflowCommand<TPayload>, metadata: Record<string, unknown> = {}): Promise<WorkflowInstance> {
    const now = this.now();
    const instance: WorkflowInstance = {
      id: `wf_${crypto.randomUUID()}`,
      workflowType: command.workflowType,
      tenantId: command.tenantId,
      workspaceId: command.workspaceId,
      initiatedBy: command.initiatedBy,
      initiatedAt: command.requestedAt,
      relatedEntityType: command.relatedEntityType,
      relatedEntityId: command.relatedEntityId,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      status: 'validating',
      currentStep: 'validate_request',
      sourceSystemRefs: [],
      inputSummary: this.sanitizeSummary(command.payload),
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveInstance(instance);
    if (command.idempotencyKey) {
      const record: IdempotencyRecord = {
        idempotencyKey: command.idempotencyKey,
        workflowType: command.workflowType,
        tenantId: command.tenantId,
        relatedEntityType: command.relatedEntityType,
        relatedEntityId: command.relatedEntityId,
        requestHash: hashRequest(command.payload),
        firstSeenAt: now,
        lastSeenAt: now,
        status: 'in_progress',
        workflowInstanceId: instance.id,
      };
      await this.store.saveIdempotency(record);
    }
    await this.publishEvent({ eventType: 'workflow.started', workflowInstanceId: instance.id, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, occurredAt: now, actorType: 'user', actorId: instance.initiatedBy, status: instance.status, payload: { workflowType: instance.workflowType }, correlationId: instance.correlationId });
    return instance;
  }

  protected async executeStep<TOutput>(instance: WorkflowInstance, input: { stepKey: string; stepType: string; sequence: number; maxRetries?: number; sourceSystem?: WorkflowSourceRef['sourceSystem']; inputRef?: Record<string, unknown>; run: () => Promise<{ output?: TOutput; status?: WorkflowStatus; sourceRefs?: WorkflowSourceRef[]; metadata?: Record<string, unknown> }> }): Promise<{ instance: WorkflowInstance; output?: TOutput }> {
    const startedAt = this.now();
    const step: WorkflowStepExecution = {
      id: `step_${crypto.randomUUID()}`,
      workflowInstanceId: instance.id,
      stepKey: input.stepKey,
      stepType: input.stepType,
      sequence: input.sequence,
      status: 'running',
      startedAt,
      retryCount: 0,
      maxRetries: input.maxRetries ?? 0,
      sourceSystem: input.sourceSystem,
      inputRef: input.inputRef,
      metadata: {},
    };
    instance.currentStep = input.stepKey;
    instance.status = input.stepKey === 'validate_request' ? 'validating' : 'in_progress';
    instance.updatedAt = startedAt;
    await this.store.saveInstance(instance);
    await this.store.saveStep(step);
    await this.publishEvent({ eventType: 'workflow.step.started', workflowInstanceId: instance.id, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, occurredAt: startedAt, actorType: 'system', status: step.status, payload: { stepKey: step.stepKey }, correlationId: instance.correlationId, sourceSystem: input.sourceSystem });

    try {
      const result = await input.run();
      step.status = result.status === 'waiting_internal' || result.status === 'waiting_external' ? 'waiting' : 'succeeded';
      step.completedAt = this.now();
      step.outputRef = result.output && typeof result.output === 'object' ? result.output as Record<string, unknown> : undefined;
      step.metadata = result.metadata ?? {};
      instance.status = result.status ?? instance.status;
      instance.updatedAt = step.completedAt;
      if (result.sourceRefs?.length) {
        instance.sourceSystemRefs = dedupeRefs([...instance.sourceSystemRefs, ...result.sourceRefs]);
      }
      await this.store.saveStep(step);
      await this.store.saveInstance(instance);
      await this.publishEvent({ eventType: 'workflow.step.completed', workflowInstanceId: instance.id, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, occurredAt: step.completedAt, actorType: 'system', status: step.status, payload: { stepKey: step.stepKey }, correlationId: instance.correlationId, sourceSystem: input.sourceSystem });
      return { instance, output: result.output };
    } catch (error) {
      const known = classifyUnknownFailure(error);
      step.status = 'failed';
      step.completedAt = this.now();
      step.errorRef = { code: known.code, message: known.message, category: known.category };
      await this.store.saveStep(step);
      await this.failWorkflow(instance, known.category, known.message, known.retryable, { stepKey: input.stepKey, code: known.code, ...known.details });
      throw known;
    }
  }

  protected async completeWorkflow(instance: WorkflowInstance, outputSummary: Record<string, unknown>, status: WorkflowStatus = 'completed') {
    const now = this.now();
    instance.status = status;
    instance.outputSummary = outputSummary;
    instance.completedAt = now;
    instance.updatedAt = now;
    await this.store.saveInstance(instance);
    await this.publishEvent({ eventType: status === 'completed' ? 'workflow.completed' : 'workflow.waiting_internal', workflowInstanceId: instance.id, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, occurredAt: now, actorType: 'system', status, payload: outputSummary, correlationId: instance.correlationId });
    if (instance.idempotencyKey) {
      await this.store.saveIdempotency({ idempotencyKey: instance.idempotencyKey, workflowType: instance.workflowType, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, requestHash: hashRequest(instance.inputSummary), firstSeenAt: instance.createdAt, lastSeenAt: now, status: status === 'failed' ? 'failed' : 'completed', workflowInstanceId: instance.id });
    }
  }

  protected async failWorkflow(instance: WorkflowInstance, category: WorkflowFailureCategory, message: string, retryable: boolean, details?: Record<string, unknown>) {
    const now = this.now();
    instance.status = 'failed';
    instance.failureSummary = { category, message, retryable, details };
    instance.updatedAt = now;
    instance.completedAt = now;
    await this.store.saveInstance(instance);
    await this.publishEvent({ eventType: 'workflow.failed', workflowInstanceId: instance.id, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, occurredAt: now, actorType: 'system', status: 'failed', payload: { category, message }, correlationId: instance.correlationId });
    if (instance.idempotencyKey) {
      await this.store.saveIdempotency({ idempotencyKey: instance.idempotencyKey, workflowType: instance.workflowType, tenantId: instance.tenantId, relatedEntityType: instance.relatedEntityType, relatedEntityId: instance.relatedEntityId, requestHash: hashRequest(instance.inputSummary), firstSeenAt: instance.createdAt, lastSeenAt: now, status: 'failed', workflowInstanceId: instance.id });
    }
  }

  protected async publishEvent(event: WorkflowEvent) {
    await this.publisher.publish(event);
  }

  protected async resolveExistingIdempotentResult(record: IdempotencyRecord): Promise<WorkflowActionResult | null> {
    const workflow = await this.store.getWorkflowInstance(record.workflowInstanceId);
    if (!workflow) return null;
    return { success: workflow.status !== 'failed', workflowInstanceId: workflow.id, status: workflow.status, nextStep: workflow.currentStep, warnings: workflow.status === 'partially_completed' ? [{ code: 'workflow_partial', message: 'Workflow previously completed with warnings.' }] : [], errors: workflow.failureSummary ? [{ code: workflow.failureSummary.category, message: workflow.failureSummary.message }] : [], sourceRefs: workflow.sourceSystemRefs, meta: { deduplicated: true } };
  }

  protected sanitizeSummary(payload: unknown) {
    return JSON.parse(JSON.stringify(payload ?? {}));
  }
}

function dedupeRefs(refs: WorkflowSourceRef[]) {
  const map = new Map(refs.map((ref) => [`${ref.sourceSystem}:${ref.sourceRecordType}:${ref.sourceRecordId}`, ref]));
  return [...map.values()];
}
