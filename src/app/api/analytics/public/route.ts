import { NextRequest, NextResponse } from 'next/server';
import { ANALYTICS_EVENTS, AnalyticsEventType, safeLogAnalyticsEvent } from '@/lib/analytics';

const ALLOWED_PUBLIC_EVENTS: AnalyticsEventType[] = [
  ANALYTICS_EVENTS.SIGNUP_STARTED,
  ANALYTICS_EVENTS.CATALOGUE_SEARCH_PERFORMED,
  ANALYTICS_EVENTS.CATALOGUE_FILTER_APPLIED,
  ANALYTICS_EVENTS.PUBLIC_RESOURCE_VIEWED,
  ANALYTICS_EVENTS.PUBLIC_OFFER_VIEWED,
  ANALYTICS_EVENTS.ARTICLE_VIEWED,
  ANALYTICS_EVENTS.SERVICE_PAGE_VIEWED,
];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { eventType?: AnalyticsEventType; targetId?: string; targetType?: string; metadata?: Record<string, unknown>; sessionId?: string };
  if (!body?.eventType || !ALLOWED_PUBLIC_EVENTS.includes(body.eventType)) {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
  }

  await safeLogAnalyticsEvent({
    eventType: body.eventType,
    targetId: body.targetId,
    targetType: body.targetType,
    metadata: body.metadata,
    sessionId: body.sessionId,
  });

  return NextResponse.json({ ok: true });
}
