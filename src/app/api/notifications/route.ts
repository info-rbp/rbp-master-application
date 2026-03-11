import { NextRequest, NextResponse } from 'next/server';
import { listNotificationsForUser, markAllNotificationsReadForUser, markNotificationRead } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const role = request.nextUrl.searchParams.get('role');

  if (!userId || (role !== 'member' && role !== 'admin')) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const notifications = await listNotificationsForUser(userId, role);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.mode === 'single' && body.notificationId) {
    await markNotificationRead(body.notificationId);
    return NextResponse.json({ ok: true });
  }

  if (body.mode === 'all' && body.userId) {
    await markAllNotificationsReadForUser(body.userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
}
