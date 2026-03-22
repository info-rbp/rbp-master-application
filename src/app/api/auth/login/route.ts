import { NextRequest, NextResponse } from 'next/server';
import { buildAuthentikLoginUrl, createNonce, createPkceVerifier, createState } from '@/lib/platform/auth/authentik';
import { platformEnv } from '@/lib/platform/config';
import { authenticateLocalUser } from '@/lib/platform/auth/local';
import { createPersistedSession, persistAuthFlowState, persistPlatformSession } from '@/lib/platform/session';

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo') ?? '/dashboard';

  if (platformEnv.localAuthEnabled) {
    const response = NextResponse.redirect(new URL(`/login?local=1&next=${encodeURIComponent(returnTo)}`, request.url));
    return response;
  }

  const { verifier, challenge } = createPkceVerifier();
  const state = createState();
  const nonce = createNonce();
  await persistAuthFlowState({ state, nonce, codeVerifier: verifier, returnTo });
  const login = await buildAuthentikLoginUrl({ state, nonce, codeChallenge: challenge, returnTo });
  return NextResponse.redirect(login.url);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; returnTo?: string } | null;
  if (!platformEnv.localAuthEnabled) {
    return NextResponse.json({ error: 'Local auth is disabled' }, { status: 400 });
  }
  if (!body?.email || !body.password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  const principal = authenticateLocalUser({ email: body.email, password: body.password });
  if (!principal) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const persisted = createPersistedSession({
    principal,
    auth: { provider: 'local' },
    activeTenantId: principal.defaultTenantId,
  });
  await persistPlatformSession(persisted);
  return NextResponse.json({ ok: true, returnTo: body.returnTo ?? '/dashboard' });
}
