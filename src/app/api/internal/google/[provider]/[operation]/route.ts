import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

import { getAdminApp } from '@/firebase/server';
import { getGoogleAccessToken } from '@/lib/google-api-broker';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string; operation: string }> },
) {
  const sessionCookie = (await cookies()).get('rbp_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;
  const { provider, operation } = await params;
  const body = (await req.json()) as { scopes?: string[]; payload?: unknown };
  const scopes = Array.isArray(body.scopes) ? body.scopes.filter((scope): scope is string => typeof scope === 'string' && scope.length > 0) : [];

  if (!provider || !operation) {
    return NextResponse.json({ error: 'invalid_google_route' }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken(uid, scopes);
    const apiUrl = new URL(`https://www.googleapis.com/${provider}/v3/${operation}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body.payload ?? {}),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'google_api_proxy_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
