import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEventType, safeLogAnalyticsEvent } from '@/lib/analytics-server';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { eventType?: AnalyticsEventType; targetId?: string; targetType?: string; metadata?: Record<string, unknown>; sessionId?: string };
  if (!body?.eventType) {
    return NextResponse.json({ error: 'Missing eventType' }, { status: 400 });
  }

  await safeLogAnalyticsEvent({
    eventType: body.eventType,
    userId: auth.userId,
    userRole: auth.role,
    targetId: body.targetId,
    targetType: body.targetType,
    metadata: body.metadata,
    sessionId: body.sessionId,
  });

  return NextResponse.json({ ok: true });
}
