import { NextRequest, NextResponse } from 'next/server';
import { type AnalyticsEventType } from '@/lib/analytics-events';
import { safeLogAnalyticsEvent } from '@/lib/analytics-server';
import { getRequestAuthContext } from '@/lib/server-auth';
import { readJsonBody } from '@/lib/http';

export async function POST(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readJsonBody<{ eventType?: AnalyticsEventType; targetId?: string; targetType?: string; metadata?: Record<string, unknown>; sessionId?: string }>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
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
