import { firestore } from '@/firebase/server';
import { safeLogAnalyticsEvent } from './analytics';
import { logAuditEvent } from './audit';
import { triggerAdminAlert, triggerMembershipAlert } from './alerts';
import { normalizeMembershipStatusFromSquare } from './subscriptions';

function asIsoString(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}


async function findPlanByVariationId(variationId?: string) {
  if (!variationId) return null;
  const snapshot = await firestore.collection('membership_plans').where('squareSubscriptionPlanVariationId', '==', variationId).limit(1).get();
  return snapshot.docs[0] ?? null;
}

async function findUserBySquareCustomerId(customerId?: string) {
  if (!customerId) return null;
  const snapshot = await firestore.collection('users').where('squareCustomerId', '==', customerId).limit(1).get();
  return snapshot.docs[0] ?? null;
}

async function recordBillingHistory(input: {
  eventType: string;
  squareSubscriptionId?: string;
  userId?: string;
  planId?: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: Record<string, unknown>;
}) {
  await firestore.collection('billing_history').add({
    ...input,
    squareSubscriptionId: input.squareSubscriptionId ?? null,
    userId: input.userId ?? null,
    planId: input.planId ?? null,
    previousStatus: input.previousStatus ?? null,
    newStatus: input.newStatus ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  });
}

export async function processSquareEvent(event: Record<string, any>) {
  const eventId = String(event.event_id ?? event.id ?? '');
  if (!eventId) throw new Error('Missing Square event id.');

  const processedRef = firestore.doc(`square_webhook_events/${eventId}`);
  const processedSnap = await processedRef.get();
  if (processedSnap.exists) {
    return { duplicate: true };
  }

  const eventType = String(event.type ?? '').toLowerCase();
  const payload = event.data?.object ?? {};
  const subscription = payload.subscription ?? payload;
  const squareSubscriptionId = String(subscription.id ?? payload.subscription_id ?? '');
  const squareCustomerId = String(subscription.customer_id ?? payload.customer_id ?? '') || undefined;
  const previousStatus = String(subscription.old_status ?? payload.old_status ?? '').toLowerCase() || undefined;
  const newStatus = normalizeMembershipStatusFromSquare(subscription.status ?? payload.status);

  const planDoc = await findPlanByVariationId(subscription.plan_variation_id);
  const userDoc = await findUserBySquareCustomerId(squareCustomerId);

  const subscriptionRef = squareSubscriptionId
    ? firestore.collection('subscriptions').doc(squareSubscriptionId)
    : firestore.collection('subscriptions').doc();

  const beforeSubscription = await subscriptionRef.get();

  const membershipPlanId = planDoc?.id ?? null;
  const userId = userDoc?.id ?? null;

  await subscriptionRef.set({
    userId,
    membershipPlanId,
    squareSubscriptionId,
    squareCustomerId: squareCustomerId ?? null,
    squareLocationId: subscription.location_id ?? null,
    status: newStatus,
    startDate: asIsoString(subscription.start_date) ?? new Date().toISOString(),
    currentBillingAnchorDate: asIsoString(subscription.phases?.[0]?.cadence) ?? null,
    chargedThroughDate: asIsoString(subscription.charged_through_date) ?? null,
    canceledDate: asIsoString(subscription.canceled_date) ?? null,
    cardId: subscription.card_id ?? null,
    sourceType: 'square_webhook',
    updatedAt: new Date().toISOString(),
    createdAt: beforeSubscription.exists ? beforeSubscription.data()?.createdAt : new Date().toISOString(),
    lastPaymentAt: beforeSubscription.data()?.lastPaymentAt ?? null,
    lastPaymentStatus: beforeSubscription.data()?.lastPaymentStatus ?? null,
  }, { merge: true });

  if (userDoc) {
    await firestore.doc(`users/${userDoc.id}`).set({
      membershipStatus: newStatus,
      subscriptionPlanId: membershipPlanId,
      membershipTier: planDoc?.data()?.name ?? userDoc.data()?.membershipTier ?? 'none',
      squareSubscriptionId,
      squareCustomerId: squareCustomerId ?? null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  if (eventType === 'invoice.payment_made' || eventType === 'payment.updated') {
    const paymentStatus = String(payload.payment?.status ?? payload.status ?? '').toUpperCase();
    const normalizedPaymentStatus = paymentStatus === 'COMPLETED' ? 'paid' : paymentStatus === 'FAILED' ? 'failed' : 'pending';
    const paymentAt = new Date().toISOString();
    await subscriptionRef.set({
      lastPaymentAt: paymentAt,
      lastPaymentStatus: normalizedPaymentStatus,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (userDoc) {
      await firestore.doc(`users/${userDoc.id}`).set({
        lastPaymentAt: paymentAt,
        lastPaymentStatus: normalizedPaymentStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (normalizedPaymentStatus === 'failed' && userDoc?.data()?.email) {
      await triggerMembershipAlert({
        type: 'payment_failed',
        userId: userDoc.id,
        email: String(userDoc.data().email),
        title: 'Payment failed',
        message: 'Your latest membership payment failed. Please update billing details in Square checkout.',
        actionUrl: '/membership/subscribe',
      });
      await triggerAdminAlert({
        type: 'payment_failed',
        title: 'Member payment failed',
        message: `Payment failed for user ${userDoc.id}`,
        actionUrl: '/admin/membership/subscription-and-billing-oversight',
      });
    }

    await safeLogAnalyticsEvent({
      eventType: normalizedPaymentStatus === 'failed' ? 'payment_failure' : 'payment_succeeded',
      userId: userId ?? undefined,
      userRole: userDoc ? 'member' : undefined,
      targetId: squareSubscriptionId,
      targetType: 'square_subscription',
      metadata: { squareEventType: eventType },
    });
  }

  await recordBillingHistory({
    eventType,
    squareSubscriptionId,
    userId: userId ?? undefined,
    planId: membershipPlanId ?? undefined,
    previousStatus,
    newStatus,
    metadata: { squareCustomerId },
  });

  await processedRef.set({
    eventType,
    processedAt: new Date(),
  });

  await logAuditEvent({
    actorUserId: 'square-webhook',
    actorRole: 'admin',
    actionType: 'billing_webhook_processed',
    targetType: 'square_subscription',
    targetId: squareSubscriptionId,
    before: beforeSubscription.data() ?? null,
    after: (await subscriptionRef.get()).data() ?? null,
    metadata: { eventType, eventId },
  });

  return { duplicate: false, eventType };
}
