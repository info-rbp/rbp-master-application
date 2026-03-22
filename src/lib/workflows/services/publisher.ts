import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';
import type { WorkflowEvent } from '@/lib/workflows/types';

export class WorkflowEventPublisher {
  async publish(event: WorkflowEvent) {
    console.log('[workflow.event]', event);
    await getWorkflowStore().saveEvent(event);
  }
}
