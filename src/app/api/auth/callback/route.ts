import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthFlowState, createPersistedSession, persistPlatformSession } from '@/lib/platform/session';
import { exchangeCodeForTokens, type AuthentikClaims, validateIdToken } from '@/lib/platform/auth/authentik';
import { resolvePrincipalFromBootstrap } from '@/lib/platform/bootstrap';
import { setCsrfCookie } from '@/lib/platform/csrf/csrf';
import { recordAuditEvent } from '@/lib/platform/audit/audit-service';
import { upsertPrincipal, upsertTenantMembership } from '@/lib/platform/persistence';

function extractClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const flow = await consumeAuthFlowState();
  const { ipAddress, userAgent } = extractClientInfo(request);

  if (!code || !state || !flow || flow.state !== state) {
    await recordAuditEvent({
      eventType: 'auth.callback.failed',
      actorType: 'system',
      details: { reason: 'invalid_state_or_code', hasCode: !!code, hasState: !!state, hasFlow: !!flow },
      ipAddress,
      userAgent,
      outcome: 'failure',
    });
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, flow.codeVerifier);
    if (!tokens.id_token) throw new Error('missing_id_token');
    const claims = (await validateIdToken(tokens.id_token, flow.nonce)) as AuthentikClaims;
    const principal = resolvePrincipalFromBootstrap({
      email: claims.email,
      providerUserId: claims.sub,
      groups: claims.groups,
    });
    if (!principal) {
      await recordAuditEvent({
        eventType: 'auth.callback.failed',
        actorType: 'provider',
        details: { reason: 'tenant_unmapped', email: claims.email, sub: claims.sub },
        ipAddress,
        userAgent,
        outcome: 'denied',
      });
      return NextResponse.redirect(new URL('/access-denied?reason=tenant_unmapped', request.url));
    }

    principal.user = {
      ...principal.user,
      authProviderUserId: claims.sub,
      displayName: principal.user.displayName || claims.preferred_username || claims.email || principal.user.email,
      firstName: claims.given_name ?? principal.user.firstName,
      lastName: claims.family_name ?? principal.user.lastName,
      avatarUrl: claims.picture,
    };

    // Persist principal and tenant memberships to platform store
    try {
      await upsertPrincipal(principal.user);
      for (const tenantId of principal.availableTenantIds) {
        await upsertTenantMembership(principal.user.id, tenantId, 'active');
      }
    } catch (err) {
      console.warn('[auth.callback] Non-fatal: failed to persist principal projection', err);
    }

    const persisted = createPersistedSession({
      principal,
      auth: {
        provider: 'authentik',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      },
      activeTenantId: principal.defaultTenantId,
    });

    await persistPlatformSession(persisted);
    await setCsrfCookie();

    await recordAuditEvent({
      eventType: 'auth.callback.success',
      actorId: principal.user.id,
      actorEmail: principal.user.email,
      actorType: 'user',
      sessionId: persisted.sessionId,
      tenantId: persisted.activeTenantId,
      details: { provider: 'authentik', sub: claims.sub, groups: claims.groups },
      ipAddress,
      userAgent,
      outcome: 'success',
    });

    return NextResponse.redirect(new URL(flow.returnTo || '/dashboard', request.url));
  } catch (error) {
    await recordAuditEvent({
      eventType: 'auth.callback.failed',
      actorType: 'system',
      details: { reason: 'exchange_or_validation_error', error: error instanceof Error ? error.message : String(error) },
      ipAddress,
      userAgent,
      outcome: 'failure',
    });
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
  }
}
