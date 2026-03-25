import { NextRequest, NextResponse } from 'next/server';
import { buildLogoutUrl } from '@/lib/platform/auth/authentik';
import { clearPlatformSession, getPersistedPlatformSession } from '@/lib/platform/session';
import { platformEnv } from '@/lib/platform/config';
import { validateCsrf } from '@/lib/platform/csrf/csrf';
import { recordAuditEvent } from '@/lib/platform/audit/audit-service';

function extractClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  };
}

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = extractClientInfo(request);

  // CSRF check
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    await recordAuditEvent({
      eventType: 'csrf.validation_failed',
      actorType: 'system',
      details: { endpoint: '/api/auth/logout', reason: csrf.reason },
      ipAddress,
      userAgent,
      outcome: 'denied',
    });
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  const existing = await getPersistedPlatformSession();

  await recordAuditEvent({
    eventType: 'auth.logout',
    actorId: existing?.user.id,
    actorEmail: existing?.user.email,
    actorType: 'user',
    sessionId: existing?.sessionId,
    tenantId: existing?.activeTenantId,
    details: { provider: existing?.auth.provider ?? 'unknown' },
    ipAddress,
    userAgent,
    outcome: 'success',
  });

  await clearPlatformSession();
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const redirectTo = existing?.auth.provider === 'authentik'
    ? await buildLogoutUrl(existing.auth.idToken)
    : platformEnv.appBaseUrl;

  if (wantsJson) {
    return NextResponse.json({ ok: true, redirectTo });
  }
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
