import { getWorkflowStore } from '@/lib/workflows/store/workflow-store';
import type { WorkflowEvent } from '@/lib/workflows/types';
import { PlatformEventPublisher } from '@/lib/events/publisher';

export class WorkflowEventPublisher {
  private readonly store = getWorkflowStore();
  private readonly events = new PlatformEventPublisher();

  async publish(event: WorkflowEvent) {
    console.log('[workflow.event]', event);
    await this.store.saveEvent(event);
    await this.events.publishAudit({
      eventType: event.eventType,
      action: event.eventType.split('.').slice(-1)[0] ?? 'event',
      category: 'workflow',
      tenantId: event.tenantId,
      actorType: event.actorType === 'workflow' ? 'workflow' : event.actorType === 'user' ? 'user' : 'system',
      actorId: event.actorId,
      subjectEntityType: 'workflow',
      subjectEntityId: event.workflowInstanceId,
      targetEntityType: event.relatedEntityType,
      targetEntityId: event.relatedEntityId,
      relatedEntityRefs: [{ entityType: event.relatedEntityType, entityId: event.relatedEntityId }],
      sourceSystem: event.sourceSystem ?? 'platform',
      correlationId: event.correlationId,
      outcome: event.eventType.endsWith('failed') ? 'failure' : event.eventType.includes('waiting') ? 'partial' : 'success',
      severity: event.eventType.endsWith('failed') ? 'error' : event.eventType.includes('waiting') ? 'warning' : 'info',
      metadata: event.payload,
      sensitivity: 'internal',
    });

    if (event.eventType === 'workflow.failed' || event.eventType === 'workflow.waiting_internal') {
      await this.events.publishNotification({
        tenantId: event.tenantId,
        recipientType: 'tenant_admins',
        recipientId: 'role_tenant_admin',
        notificationType: event.eventType === 'workflow.failed' ? 'workflow.failed' : 'workflow.waiting_user_action',
        category: 'workflow',
        title: event.eventType === 'workflow.failed' ? `Workflow ${event.workflowInstanceId} failed` : `Workflow ${event.workflowInstanceId} requires attention`,
        body: `${event.relatedEntityType} ${event.relatedEntityId}`,
        severity: event.eventType === 'workflow.failed' ? 'error' : 'warning',
        sourceSystem: event.sourceSystem ?? 'platform',
        sourceEventType: event.eventType,
        relatedEntityType: event.relatedEntityType,
        relatedEntityId: event.relatedEntityId,
        relatedWorkflowInstanceId: event.workflowInstanceId,
        actions: [{ key: 'open_workflow', label: 'Open workflow', type: 'navigate', route: `/api/workflows/${event.workflowInstanceId}`, requiresConfirmation: false, isPrimary: true, enabled: true }],
        channels: ['in_app'],
        dedupeKey: `${event.eventType}:${event.workflowInstanceId}`,
        metadata: { correlationId: event.correlationId },
        sourceRefs: [],
      });
    }
  }
}
