import { NextRequest } from 'next/server';
import { getPersistedPlatformSession, switchTenantContext } from '@/lib/platform/session';
import { ok, fail } from '@/lib/bff/utils/http';
import { BffApiError } from '@/lib/bff/utils/request-context';
import { toSessionDto } from '@/lib/bff/dto/common';
import { validateCsrf } from '@/lib/platform/csrf/csrf';
import { recordAuditEvent } from '@/lib/platform/audit/audit-service';

function extractClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  };
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const { ipAddress, userAgent } = extractClientInfo(request);

  // CSRF check
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    await recordAuditEvent({
      eventType: 'csrf.validation_failed',
      actorType: 'system',
      details: { endpoint: '/api/session/switch-tenant', reason: csrf.reason },
      ipAddress,
      userAgent,
      outcome: 'denied',
      correlationId,
    });
    return fail(new BffApiError('csrf_failed', 'CSRF validation failed.', 403), correlationId);
  }

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

    await recordAuditEvent({
      eventType: 'session.tenant_switch',
      actorId: before?.user.id,
      actorEmail: before?.user.email,
      actorType: 'user',
      sessionId: before?.sessionId,
      tenantId: body.tenantId,
      details: {
        previousTenantId: before?.activeTenantId,
        newTenantId: body.tenantId,
        workspaceId: body.workspaceId,
      },
      ipAddress,
      userAgent,
      outcome: 'success',
      correlationId,
    });

    return ok(toSessionDto(session), correlationId);
  } catch (error) {
    const before = await getPersistedPlatformSession().catch(() => null);
    await recordAuditEvent({
      eventType: 'session.tenant_switch_denied',
      actorId: before?.user.id,
      actorEmail: before?.user.email,
      actorType: 'user',
      sessionId: before?.sessionId,
      details: {
        requestedTenantId: body.tenantId,
        reason: error instanceof Error ? error.message : 'unknown',
      },
      ipAddress,
      userAgent,
      outcome: 'denied',
      correlationId,
    });
    return fail(error, correlationId);
  }
}
