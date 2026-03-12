import { firestore } from '@/firebase/server';
import type { BillingCycle, MembershipPlanCode, MembershipStatus, MembershipTier } from './definitions';
import { resolvePlanCodeToBillingCycle, resolvePlanCodeToTier } from './entitlements';
import { safeLogAnalyticsEvent } from './analytics-server';
import { logAuditEvent, logMembershipHistory } from './audit';
import { triggerAdminAlert, triggerMembershipAlert } from './alerts';

export type BillingLifecycleType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_canceled'
  | 'subscription_reactivated'
  | 'subscription_expired'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'promotion_granted'
  | 'promotion_expired';

export function normalizeSquareLifecycleType(eventType: string, nextStatus: MembershipStatus, paymentStatus?: 'paid' | 'failed' | 'pending'): BillingLifecycleType {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('payment') || normalized.includes('invoice')) {
    if (paymentStatus === 'failed') return 'payment_failed';
    if (paymentStatus === 'paid') return 'payment_succeeded';
  }
  if (nextStatus === 'canceled') return 'subscription_canceled';
  if (nextStatus === 'active' && normalized.includes('created')) return 'subscription_created';
  if (nextStatus === 'active' && normalized.includes('updated')) return 'subscription_updated';
  if (nextStatus === 'active' && normalized.includes('resumed')) return 'subscription_reactivated';
  if (nextStatus === 'lapsed' || nextStatus === 'unpaid' || nextStatus === 'past_due') return 'subscription_expired';
  return 'subscription_updated';
}

export function resolveLifecycleStatusFromSquare(status: string | null | undefined): MembershipStatus {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'ACTIVE') return 'active';
  if (normalized === 'CANCELED') return 'canceled';
  if (normalized === 'PAUSED') return 'paused';
  if (normalized === 'DEACTIVATED') return 'lapsed';
  if (normalized === 'UNPAID') return 'unpaid';
  if (normalized === 'PAST_DUE') return 'past_due';
  if (normalized === 'PENDING') return 'pending';
  return 'pending';
}

export async function syncMembershipLifecycle(input: {
  userId?: string | null;
  squareSubscriptionId: string;
  squareCustomerId?: string | null;
  squareLocationId?: string | null;
  membershipPlanId?: string | null;
  membershipPlanCode?: MembershipPlanCode | null;
  membershipTier?: MembershipTier | null;
  billingCycle?: BillingCycle | null;
  previousStatus?: MembershipStatus | null;
  nextStatus: MembershipStatus;
  eventType: string;
  eventId: string;
  lifecycleType?: BillingLifecycleType;
  paymentStatus?: 'paid' | 'failed' | 'pending' | null;
  chargedThroughDate?: string | null;
  renewalDate?: string | null;
  canceledDate?: string | null;
  sourceType?: 'square_webhook' | 'admin' | 'system';
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const planCode = input.membershipPlanCode ?? 'basic_free';
  const membershipTier = input.membershipTier ?? resolvePlanCodeToTier(planCode);
  const billingCycle = input.billingCycle ?? resolvePlanCodeToBillingCycle(planCode);
  const lifecycleType = input.lifecycleType ?? normalizeSquareLifecycleType(input.eventType, input.nextStatus, input.paymentStatus ?? undefined);

  const subscriptionRef = firestore.collection('subscriptions').doc(input.squareSubscriptionId);
  const beforeSubscription = await subscriptionRef.get();
  await subscriptionRef.set({
    userId: input.userId ?? null,
    membershipPlanId: input.membershipPlanId ?? null,
    membershipPlanCode: planCode,
    membershipTier,
    billingCycle,
    squareSubscriptionId: input.squareSubscriptionId,
    squareCustomerId: input.squareCustomerId ?? null,
    squareLocationId: input.squareLocationId ?? null,
    status: input.nextStatus,
    chargedThroughDate: input.chargedThroughDate ?? null,
    renewalDate: input.renewalDate ?? null,
    canceledDate: input.canceledDate ?? null,
    sourceType: input.sourceType ?? 'square_webhook',
    lastPaymentStatus: input.paymentStatus ?? beforeSubscription.data()?.lastPaymentStatus ?? null,
    lastPaymentAt: input.paymentStatus ? now : beforeSubscription.data()?.lastPaymentAt ?? null,
    updatedAt: now,
    createdAt: beforeSubscription.data()?.createdAt ?? now,
  }, { merge: true });

  if (input.userId) {
    await firestore.collection('users').doc(input.userId).set({
      membershipStatus: input.nextStatus,
      membershipTier,
      membershipPlanCode: planCode,
      billingCycle,
      subscriptionPlanId: input.membershipPlanId ?? null,
      squareSubscriptionId: input.squareSubscriptionId,
      squareCustomerId: input.squareCustomerId ?? null,
      squareLocationId: input.squareLocationId ?? null,
      squareSubscriptionStatus: input.nextStatus,
      lastPaymentStatus: input.paymentStatus ?? null,
      lastPaymentAt: input.paymentStatus ? now : null,
      membershipExpiresAt: input.chargedThroughDate ?? input.canceledDate ?? null,
      updatedAt: now,
    }, { merge: true });

    await logMembershipHistory({
      userId: input.userId,
      previousTier: beforeSubscription.data()?.membershipTier ?? null,
      newTier: membershipTier,
      previousStatus: input.previousStatus ?? beforeSubscription.data()?.status ?? null,
      newStatus: input.nextStatus,
      changedBy: 'square-webhook',
      source: 'provider_sync',
      reason: `${lifecycleType}:${input.eventType}`,
    });
  }

  await firestore.collection('billing_history').add({
    eventType: input.eventType,
    lifecycleType,
    squareSubscriptionId: input.squareSubscriptionId,
    userId: input.userId ?? null,
    planId: input.membershipPlanId ?? null,
    previousStatus: input.previousStatus ?? null,
    newStatus: input.nextStatus,
    metadata: { ...(input.metadata ?? {}), paymentStatus: input.paymentStatus ?? null, eventId: input.eventId },
    createdAt: new Date(),
  });

  if (input.userId && input.paymentStatus === 'failed') {
    const user = await firestore.collection('users').doc(input.userId).get();
    const email = String(user.data()?.email ?? '').trim();
    if (email) {
      await triggerMembershipAlert({
        type: 'payment_failed',
        userId: input.userId,
        email,
        title: 'Payment failed',
        message: 'Your latest payment failed. Please update billing details.',
        actionUrl: '/membership/subscribe',
      });
    }
    await triggerAdminAlert({
      type: 'payment_failed',
      title: 'Member payment failed',
      message: `Payment failed for user ${input.userId}`,
      actionUrl: '/admin/membership/subscription-and-billing-oversight',
    });
  }

  await safeLogAnalyticsEvent({
    eventType: lifecycleType,
    userId: input.userId ?? undefined,
    userRole: input.userId ? 'member' : undefined,
    targetId: input.squareSubscriptionId,
    targetType: 'square_subscription',
    metadata: { eventType: input.eventType, paymentStatus: input.paymentStatus ?? null },
  });

  await logAuditEvent({
    actorUserId: 'square-webhook',
    actorRole: 'admin',
    actionType: 'billing_webhook_processed',
    targetType: 'square_subscription',
    targetId: input.squareSubscriptionId,
    before: beforeSubscription.data() ?? null,
    after: (await subscriptionRef.get()).data() ?? null,
    metadata: { eventType: input.eventType, eventId: input.eventId, lifecycleType },
  });

  return { lifecycleType };
}
