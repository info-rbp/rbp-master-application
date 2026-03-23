import { SessionBffService } from '@/lib/bff/services/session-bff-service';
import { ok } from '@/lib/bff/utils/http';
import { NextRequest } from 'next/server';
import { PlatformEventPublisher } from '@/lib/events/publisher';

const service = new SessionBffService();
const events = new PlatformEventPublisher();

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const data = await service.getSession();
  if (data.authenticated && data.activeTenant && data.user) {
    await events.publishAudit({ eventType: 'auth.session.restored', action: 'restore', category: 'authentication', tenantId: data.activeTenant.id, workspaceId: data.activeWorkspace?.id, actorType: 'user', actorId: data.user.id, actorDisplay: data.user.displayName, subjectEntityType: 'session', subjectEntityId: data.sessionId, relatedEntityRefs: [{ entityType: 'tenant', entityId: data.activeTenant.id }], sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'info', metadata: {}, sensitivity: 'low' });
  }
  return ok(data, correlationId);
}
