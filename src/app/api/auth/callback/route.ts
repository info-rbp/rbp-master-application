import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthFlowState, createPersistedSession, persistPlatformSession } from '@/lib/platform/session';
import { exchangeCodeForTokens, type AuthentikClaims, validateIdToken } from '@/lib/platform/auth/authentik';
import { resolvePrincipalFromBootstrap } from '@/lib/platform/bootstrap';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const flow = await consumeAuthFlowState();

  if (!code || !state || !flow || flow.state !== state) {
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
    return NextResponse.redirect(new URL(flow.returnTo || '/dashboard', request.url));
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
  }
}
