import { NextResponse } from 'next/server';
import { resolveSessionResponse } from '@/lib/platform/session';

export async function GET() {
  const response = await resolveSessionResponse();
  if (!response.authenticated) {
    return NextResponse.json({ authenticated: false, navigation: [] }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, navigation: response.session.navigation });
}
