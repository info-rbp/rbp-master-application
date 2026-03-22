import { NextRequest, NextResponse } from 'next/server';
import { buildLogoutUrl } from '@/lib/platform/auth/authentik';
import { clearPlatformSession, getPersistedPlatformSession } from '@/lib/platform/session';
import { platformEnv } from '@/lib/platform/config';

export async function POST(request: NextRequest) {
  const existing = await getPersistedPlatformSession();
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
