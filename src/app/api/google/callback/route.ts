import { NextRequest, NextResponse } from 'next/server';

import { handleGoogleCallback } from '@/lib/google-api-broker';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'missing_google_oauth_params' }, { status: 400 });
  }

  await handleGoogleCallback(code, state);

  return NextResponse.redirect(new URL('/settings/integrations?status=success', req.url));
}
