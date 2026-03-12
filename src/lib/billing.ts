import { firestore } from '@/firebase/server';
import { resolvePlanCodeToBillingCycle, resolvePlanCodeToTier } from './entitlements';
import { normalizeSquareLifecycleType, resolveLifecycleStatusFromSquare, syncMembershipLifecycle } from './membership-lifecycle';

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

function resolvePaymentStatus(eventType: string, payload: Record<string, any>) {
  const normalizedType = eventType.toLowerCase();
  if (!normalizedType.includes('payment') && !normalizedType.includes('invoice')) return null;
  const paymentStatus = String(payload.payment?.status ?? payload.status ?? '').toUpperCase();
  if (paymentStatus === 'COMPLETED' || paymentStatus === 'PAID') return 'paid' as const;
  if (paymentStatus === 'FAILED') return 'failed' as const;
  return 'pending' as const;
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
  if (!squareSubscriptionId) throw new Error('Missing Square subscription id in event payload.');

  const squareCustomerId = String(subscription.customer_id ?? payload.customer_id ?? '') || undefined;
  const previousStatus = resolveLifecycleStatusFromSquare(subscription.old_status ?? payload.old_status ?? null);
  const nextStatus = resolveLifecycleStatusFromSquare(subscription.status ?? payload.status ?? null);
  const paymentStatus = resolvePaymentStatus(eventType, payload);

  const planDoc = await findPlanByVariationId(subscription.plan_variation_id);
  const userDoc = await findUserBySquareCustomerId(squareCustomerId);

  const resolvedPlan = planDoc?.data() as Record<string, unknown> | undefined;
  const planCode = (resolvedPlan?.code as any) ?? 'basic_free';
  const membershipTier = (resolvedPlan?.tier as any) ?? resolvePlanCodeToTier(planCode);
  const billingCycle = (resolvedPlan?.billingCycle as any) ?? resolvePlanCodeToBillingCycle(planCode);
  const lifecycleType = normalizeSquareLifecycleType(eventType, nextStatus, paymentStatus ?? undefined);

  const result = await syncMembershipLifecycle({
    userId: userDoc?.id ?? null,
    squareSubscriptionId,
    squareCustomerId: squareCustomerId ?? null,
    squareLocationId: String(subscription.location_id ?? '') || null,
    membershipPlanId: planDoc?.id ?? null,
    membershipPlanCode: planCode,
    membershipTier,
    billingCycle,
    previousStatus,
    nextStatus,
    eventType,
    eventId,
    lifecycleType,
    paymentStatus,
    chargedThroughDate: asIsoString(subscription.charged_through_date),
    renewalDate: asIsoString(subscription.phases?.[0]?.end_date),
    canceledDate: asIsoString(subscription.canceled_date),
    metadata: { squareCustomerId: squareCustomerId ?? null, planVariationId: subscription.plan_variation_id ?? null },
  });

  await processedRef.set({
    eventType,
    lifecycleType: result.lifecycleType,
    squareSubscriptionId,
    userId: userDoc?.id ?? null,
    processedAt: new Date(),
  });

  return { duplicate: false, eventType, lifecycleType: result.lifecycleType };
}
