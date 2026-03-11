import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthContext } from '@/lib/server-auth';
import { createNotification } from '@/lib/notifications';
import { triggerAdminAlert } from '@/lib/alerts';
import { safeLogAnalyticsEvent } from '@/lib/analytics';
import { sendTemplatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Promise.all([
    createNotification({
      userId: auth.userId,
      audienceRole: 'member',
      audienceType: 'direct',
      type: 'welcome',
      title: 'Welcome to Remote Business Partner',
      message: 'Your account has been created. Verify your email to unlock your member access.',
      actionUrl: '/verify-email',
      severity: 'success',
    }),
    safeLogAnalyticsEvent({ eventType: 'signup_success', userId: auth.userId, userRole: auth.role }),
    triggerAdminAlert({
      type: 'new_signup',
      title: 'New member signup',
      message: `A new member account was created (${auth.email ?? auth.userId}).`,
      actionUrl: '/admin/membership/members',
    }),
    auth.email
      ? sendTemplatedEmail({ recipient: auth.email, templateKey: 'welcome' })
      : Promise.resolve({ ok: false as const, reason: 'missing_email' as const }),
  ]);

  return NextResponse.json({ ok: true });
}
