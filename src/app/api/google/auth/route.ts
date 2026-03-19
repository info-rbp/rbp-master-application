import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

import { getAdminApp } from '@/firebase/server';
import { getGoogleAuthUrl } from '@/lib/google-api-broker';

export async function GET(req: NextRequest) {
  const sessionCookie = (await cookies()).get('rbp_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;

  const scopes = req.nextUrl.searchParams.get('scopes')?.split(',').filter(Boolean) || [];
  const authUrl = await getGoogleAuthUrl(uid, scopes);

  return NextResponse.redirect(authUrl);
}
