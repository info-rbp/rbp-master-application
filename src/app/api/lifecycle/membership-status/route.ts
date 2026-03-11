import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthContext } from '@/lib/server-auth';
import { firestore } from '@/firebase/server';
import { triggerAdminAlert, triggerMembershipAlert } from '@/lib/alerts';

type Payload = {
  userId?: string;
  previousStatus?: string;
  newStatus?: string;
  membershipEndDate?: string;
  reason?: string;
};

export async function POST(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as Payload;
  const userId = body.userId?.trim();
  const newStatus = body.newStatus?.trim().toLowerCase();
  const previousStatus = body.previousStatus?.trim().toLowerCase();

  if (!userId || !newStatus) {
    return NextResponse.json({ error: 'userId and newStatus are required.' }, { status: 400 });
  }

  const userSnap = await firestore.collection('users').doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const email = String(userSnap.data()?.email ?? '').trim();
  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'missing_email' });
  }

  if (newStatus === 'past_due' || newStatus === 'unpaid') {
    await triggerMembershipAlert({
      type: 'payment_failed',
      userId,
      email,
      title: 'Payment failed',
      message: 'We could not process your latest payment. Please update your billing details.',
      actionUrl: '/membership/subscribe',
      reason: body.reason,
    });
    await triggerAdminAlert({
      type: 'payment_failed',
      title: 'Member payment failure',
      message: `Payment failed for user ${userId}.`,
      actionUrl: '/admin/membership/subscription-and-billing-oversight',
    });
  } else if (newStatus === 'expired' || newStatus === 'lapsed') {
    await triggerMembershipAlert({
      type: 'membership_expired',
      userId,
      email,
      title: 'Membership expired',
      message: 'Your membership has expired.',
      actionUrl: '/membership/subscribe',
      membershipEndDate: body.membershipEndDate,
      reason: body.reason,
    });
  } else if (newStatus === 'canceled') {
    await triggerMembershipAlert({
      type: 'subscription_canceled',
      userId,
      email,
      title: 'Subscription canceled',
      message: 'Your subscription has been canceled.',
      actionUrl: '/membership/subscribe',
      reason: body.reason,
    });
  } else if (newStatus === 'active' && ['canceled', 'suspended', 'expired', 'lapsed', 'past_due', 'unpaid'].includes(previousStatus ?? '')) {
    await triggerMembershipAlert({
      type: 'subscription_reactivated',
      userId,
      email,
      title: 'Subscription reactivated',
      message: 'Your subscription has been reactivated.',
      actionUrl: '/account',
      reason: body.reason,
    });
  } else if (newStatus === 'active' && body.membershipEndDate) {
    await triggerMembershipAlert({
      type: 'membership_expiring',
      userId,
      email,
      title: 'Membership expiring soon',
      message: `Your membership is expiring on ${body.membershipEndDate}.`,
      actionUrl: '/membership/subscribe',
      membershipEndDate: body.membershipEndDate,
      reason: body.reason,
    });
  }

  return NextResponse.json({ ok: true });
}
