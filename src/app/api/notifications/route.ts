import { NextRequest, NextResponse } from 'next/server';
import {
  getUnreadNotificationCount,
  listNotificationsForActor,
  markAllNotificationsReadForActor,
  markNotificationRead,
} from '@/lib/notifications';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = await listNotificationsForActor({ userId: auth.userId, role: auth.role });
  const unreadCount = await getUnreadNotificationCount({ userId: auth.userId, role: auth.role });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { mode?: 'single' | 'all'; notificationId?: string };

  if (body.mode === 'single' && body.notificationId) {
    const notifications = await listNotificationsForActor({ userId: auth.userId, role: auth.role });
    if (!notifications.find((item) => item.id === body.notificationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await markNotificationRead(body.notificationId);
    return NextResponse.json({ ok: true });
  }

  if (body.mode === 'all') {
    await markAllNotificationsReadForActor({ userId: auth.userId, role: auth.role });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
}
