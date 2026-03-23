import { NextRequest } from 'next/server';
import { getPersistedPlatformSession, switchTenantContext } from '@/lib/platform/session';
import { ok, fail } from '@/lib/bff/utils/http';
import { BffApiError } from '@/lib/bff/utils/request-context';
import { toSessionDto } from '@/lib/bff/dto/common';
import { PlatformEventPublisher } from '@/lib/events/publisher';

const events = new PlatformEventPublisher();

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const body = (await request.json().catch(() => null)) as { tenantId?: string; workspaceId?: string } | null;
  if (!body?.tenantId) {
    return fail(new BffApiError('invalid_request', 'tenantId is required.', 400), correlationId);
  }

  try {
    const before = await getPersistedPlatformSession();
    const session = await switchTenantContext({ tenantId: body.tenantId, workspaceId: body.workspaceId });
    if (!session) {
      throw new BffApiError('unauthenticated', 'Authentication is required for this endpoint.', 401);
    }
    await events.publishAudit({ eventType: 'tenant.switched', action: 'switch_tenant', category: 'tenancy', tenantId: session.activeTenant.id, workspaceId: session.activeWorkspace?.id, actorType: 'user', actorId: session.user.id, actorDisplay: session.user.displayName, subjectEntityType: 'tenant', subjectEntityId: session.activeTenant.id, relatedEntityRefs: before?.activeTenantId ? [{ entityType: 'tenant', entityId: before.activeTenantId }] : [], sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'info', metadata: { previousTenantId: before?.activeTenantId }, sensitivity: 'internal' });
    if (session.activeWorkspace?.id) {
      await events.publishAudit({ eventType: 'workspace.switched', action: 'switch_workspace', category: 'tenancy', tenantId: session.activeTenant.id, workspaceId: session.activeWorkspace.id, actorType: 'user', actorId: session.user.id, actorDisplay: session.user.displayName, subjectEntityType: 'workspace', subjectEntityId: session.activeWorkspace.id, relatedEntityRefs: [], sourceSystem: 'platform', correlationId, outcome: 'success', severity: 'info', metadata: { previousWorkspaceId: before?.activeWorkspaceId }, sensitivity: 'internal' });
    }
    return ok(toSessionDto(session), correlationId);
  } catch (error) {
    return fail(error, correlationId);
  }
}
