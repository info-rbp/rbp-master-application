import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';
import type { WorkflowStatusDto } from '@/lib/workflows/dto/workflow-dto';
import { toWorkflowInstanceDto } from '@/lib/workflows/dto/workflow-dto';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { WorkflowError } from '@/lib/workflows/utils/errors';

export class WorkflowStatusQueryService {
  private readonly store = getWorkflowStore();

  async getWorkflowStatus(context: BffRequestContext, workflowId: string): Promise<WorkflowStatusDto> {
    const status = await this.store.getWorkflowStatus(workflowId);
    if (!status) throw new WorkflowError({ code: 'workflow_not_found', message: 'Workflow was not found.', status: 404, category: 'validation_failure' });
    if (status.workflow.tenantId !== context.session.activeTenant.id) throw new WorkflowError({ code: 'workflow_forbidden', message: 'Workflow is outside the active tenant scope.', status: 403, category: 'permission_denied' });
    return { workflow: toWorkflowInstanceDto(status.workflow), steps: status.steps, events: status.events, warnings: status.workflow.status === 'partially_completed' ? [{ code: 'workflow_partial', message: 'Workflow completed with warnings.' }] : [], failureSummary: status.workflow.failureSummary, outputSummary: status.workflow.outputSummary };
  }
}
