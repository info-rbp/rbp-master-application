export type WorkflowType = 'application_submission' | 'document_upload' | 'support_escalation' | 'billing_event' | 'review_approval';
export type WorkflowStatus = 'pending' | 'validating' | 'queued' | 'in_progress' | 'waiting_internal' | 'waiting_external' | 'partially_completed' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
export type WorkflowStepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'waiting' | 'cancelled' | 'retry_scheduled';
export type WorkflowFailureCategory = 'validation_failure' | 'auth_failure' | 'permission_denied' | 'upstream_timeout' | 'upstream_unavailable' | 'upstream_validation_failure' | 'workflow_state_conflict' | 'duplicate_request' | 'unknown_failure';

export type WorkflowSourceRef = {
  sourceSystem: 'platform' | 'odoo' | 'lending' | 'marble' | 'n8n' | 'docspell';
  sourceRecordType: string;
  sourceRecordId: string;
  sourceUrl?: string;
  syncedAt: string;
};

export type WorkflowInstance = {
  id: string;
  workflowType: WorkflowType;
  tenantId: string;
  workspaceId?: string;
  initiatedBy: string;
  initiatedAt: string;
  relatedEntityType: string;
  relatedEntityId: string;
  idempotencyKey?: string;
  correlationId: string;
  status: WorkflowStatus;
  currentStep: string;
  sourceSystemRefs: WorkflowSourceRef[];
  inputSummary: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  failureSummary?: { category: WorkflowFailureCategory; message: string; retryable: boolean; details?: Record<string, unknown> };
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type WorkflowStepExecution = {
  id: string;
  workflowInstanceId: string;
  stepKey: string;
  stepType: string;
  sequence: number;
  status: WorkflowStepStatus;
  startedAt: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  sourceSystem?: WorkflowSourceRef['sourceSystem'];
  inputRef?: Record<string, unknown>;
  outputRef?: Record<string, unknown>;
  errorRef?: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type WorkflowCommand<TPayload = Record<string, unknown>> = {
  commandId: string;
  workflowType: WorkflowType;
  tenantId: string;
  workspaceId?: string;
  initiatedBy: string;
  relatedEntityType: string;
  relatedEntityId: string;
  payload: TPayload;
  idempotencyKey?: string;
  correlationId: string;
  requestedAt: string;
};

export type WorkflowEvent = {
  eventId: string;
  eventType: string;
  workflowInstanceId: string;
  tenantId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  occurredAt: string;
  actorType: 'system' | 'user' | 'workflow';
  actorId?: string;
  sourceSystem?: WorkflowSourceRef['sourceSystem'];
  status: WorkflowStatus | WorkflowStepStatus;
  payload: Record<string, unknown>;
  correlationId: string;
};

export type IdempotencyRecord = {
  idempotencyKey: string;
  workflowType: WorkflowType;
  tenantId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  requestHash: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: 'in_progress' | 'completed' | 'failed';
  workflowInstanceId: string;
};

export type WorkflowActionResult = {
  success: boolean;
  workflowInstanceId: string;
  status: WorkflowStatus;
  nextStep?: string;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; message: string }>;
  sourceRefs: WorkflowSourceRef[];
  meta: Record<string, unknown>;
};

export type WorkflowStoreSnapshot = {
  instances: WorkflowInstance[];
  steps: WorkflowStepExecution[];
  events: WorkflowEvent[];
  idempotency: IdempotencyRecord[];
};
