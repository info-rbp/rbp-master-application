import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { addRecentActivity, listRecentActivity } from '@/lib/member-dashboard';
import { safeLogAnalyticsEvent } from '@/lib/analytics';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ records: await listRecentActivity(auth.userId) });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.activityType || !body.title) return NextResponse.json({ error: 'activityType and title are required' }, { status: 400 });
  await addRecentActivity(auth.userId, { activityType: body.activityType, title: body.title, itemPath: body.itemPath ?? null, metadata: body.metadata ?? {} });
  await safeLogAnalyticsEvent({ eventType: 'member_recent_activity_clicked', userId: auth.userId, userRole: 'member', targetType: body.activityType, targetId: body.itemPath ?? undefined });
  return NextResponse.json({ ok: true }, { status: 201 });
}
