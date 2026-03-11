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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const tasks: Promise<unknown>[] = [
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
  ];

  if (auth.email) {
    tasks.push(
      sendTemplatedEmail({
        recipient: auth.email,
        templateKey: 'welcome',
        triggerSource: 'signup',
        relatedUserId: auth.userId,
      }),
    );
    tasks.push(
      sendTemplatedEmail({
        recipient: auth.email,
        templateKey: 'verification',
        triggerSource: 'signup',
        relatedUserId: auth.userId,
        context: { verificationUrl: `${appUrl}/verify-email` },
      }),
    );
  }

  await Promise.all(tasks);
  return NextResponse.json({ ok: true });
}
