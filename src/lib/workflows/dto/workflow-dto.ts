import type { WorkflowActionResult, WorkflowEvent, WorkflowInstance, WorkflowSourceRef, WorkflowStatus, WorkflowStepExecution, WorkflowType } from '@/lib/workflows/types';

export type WorkflowInstanceDto = {
  id: string;
  workflowType: WorkflowType;
  status: WorkflowStatus;
  currentStep: string;
  tenantId: string;
  workspaceId?: string;
  initiatedBy: string;
  initiatedAt: string;
  relatedEntityType: string;
  relatedEntityId: string;
  sourceRefs: WorkflowSourceRef[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type WorkflowStepDto = WorkflowStepExecution;

export type WorkflowStatusDto = {
  workflow: WorkflowInstanceDto;
  steps: WorkflowStepDto[];
  events: WorkflowEvent[];
  warnings: Array<{ code: string; message: string }>;
  failureSummary?: WorkflowInstance['failureSummary'];
  outputSummary?: WorkflowInstance['outputSummary'];
};

export type WorkflowActionResultDto = WorkflowActionResult;
export type ApplicationSubmissionResultDto = WorkflowActionResultDto & { applicationId: string; applicationStatus: string; decisionSummary?: Record<string, unknown> };
export type DocumentUploadResultDto = WorkflowActionResultDto & { documentId: string; documentStatus: string; linkedEntity: { type: string; id: string } };
export type SupportEscalationResultDto = WorkflowActionResultDto & { ticketId: string; escalationStatus: string; queue?: string };
export type BillingEventResultDto = WorkflowActionResultDto & { eventType: string; relatedEntityType: string; relatedEntityId: string };
export type ReviewApprovalResultDto = WorkflowActionResultDto & { approvalState: string; lastAction: string; nextRequiredActor?: string };

export function toWorkflowInstanceDto(instance: WorkflowInstance): WorkflowInstanceDto {
  return {
    id: instance.id,
    workflowType: instance.workflowType,
    status: instance.status,
    currentStep: instance.currentStep,
    tenantId: instance.tenantId,
    workspaceId: instance.workspaceId,
    initiatedBy: instance.initiatedBy,
    initiatedAt: instance.initiatedAt,
    relatedEntityType: instance.relatedEntityType,
    relatedEntityId: instance.relatedEntityId,
    sourceRefs: instance.sourceSystemRefs,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    completedAt: instance.completedAt,
  };
}
