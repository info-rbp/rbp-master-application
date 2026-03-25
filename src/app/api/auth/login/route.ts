import { NextRequest, NextResponse } from 'next/server';
import { buildAuthentikLoginUrl, createNonce, createPkceVerifier, createState } from '@/lib/platform/auth/authentik';
import { platformEnv } from '@/lib/platform/config';
import { authenticateLocalUser } from '@/lib/platform/auth/local';
import { createPersistedSession, persistAuthFlowState, persistPlatformSession } from '@/lib/platform/session';
import { setCsrfCookie } from '@/lib/platform/csrf/csrf';
import { recordAuditEvent } from '@/lib/platform/audit/audit-service';

function extractClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  };
}

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo') ?? '/dashboard';
  const { ipAddress, userAgent } = extractClientInfo(request);

  if (platformEnv.localAuthEnabled) {
    await recordAuditEvent({
      eventType: 'auth.login.initiated',
      actorType: 'system',
      details: { provider: 'local', returnTo },
      ipAddress,
      userAgent,
      outcome: 'success',
    });
    return NextResponse.redirect(new URL(`/login?local=1&next=${encodeURIComponent(returnTo)}`, request.url));
  }

  await recordAuditEvent({
    eventType: 'auth.login.initiated',
    actorType: 'system',
    details: { provider: 'authentik', returnTo },
    ipAddress,
    userAgent,
    outcome: 'success',
  });

  const { verifier, challenge } = createPkceVerifier();
  const state = createState();
  const nonce = createNonce();
  await persistAuthFlowState({ state, nonce, codeVerifier: verifier, returnTo });
  const login = await buildAuthentikLoginUrl({ state, nonce, codeChallenge: challenge, returnTo });
  return NextResponse.redirect(login.url);
}

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = extractClientInfo(request);
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; returnTo?: string } | null;

  if (!platformEnv.localAuthEnabled) {
    return NextResponse.json({ error: 'Local auth is disabled' }, { status: 400 });
  }
  if (!body?.email || !body.password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const principal = authenticateLocalUser({ email: body.email, password: body.password });
  if (!principal) {
    await recordAuditEvent({
      eventType: 'auth.login.failed',
      actorEmail: body.email,
      actorType: 'user',
      details: { provider: 'local', reason: 'invalid_credentials' },
      ipAddress,
      userAgent,
      outcome: 'failure',
    });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const persisted = createPersistedSession({
    principal,
    auth: { provider: 'local' },
    activeTenantId: principal.defaultTenantId,
  });
  await persistPlatformSession(persisted);
  await setCsrfCookie();

  await recordAuditEvent({
    eventType: 'auth.login.success',
    actorId: principal.user.id,
    actorEmail: principal.user.email,
    actorType: 'user',
    sessionId: persisted.sessionId,
    tenantId: persisted.activeTenantId,
    details: { provider: 'local' },
    ipAddress,
    userAgent,
    outcome: 'success',
  });

  return NextResponse.json({ ok: true, returnTo: body.returnTo ?? '/dashboard' });
}
