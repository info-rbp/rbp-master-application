import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.eventType) {
    return NextResponse.json({ error: 'Missing eventType' }, { status: 400 });
  }

  await trackEvent(body);
  return NextResponse.json({ ok: true });
}
