import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/firebase/server';
import { safeLogAnalyticsEvent } from '@/lib/analytics';
import { getRequestAuthContext } from '@/lib/server-auth';
import { createSquareSubscriptionPaymentLink, resolveSquareLocationId } from '@/lib/square';
import { validatePlanForSquareCheckout } from '@/lib/subscriptions';
import type { MembershipPlan } from '@/lib/definitions';

export async function POST(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as { planId?: string };
    const planId = body.planId?.trim();
    if (!planId) return NextResponse.json({ error: 'planId is required.' }, { status: 400 });

    const planSnapshot = await firestore.collection('membership_plans').doc(planId).get();
    if (!planSnapshot.exists) return NextResponse.json({ error: 'Membership plan not found.' }, { status: 404 });

    const plan = planSnapshot.data() as Omit<MembershipPlan, 'id'>;
    const validation = validatePlanForSquareCheckout({ id: planId, ...plan });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const locationId = resolveSquareLocationId(plan.squareLocationId ?? null);
    if (!locationId) {
      return NextResponse.json({ error: 'Square location is not configured.' }, { status: 500 });
    }

    await safeLogAnalyticsEvent({
      eventType: 'checkout_started',
      userId: auth.userId,
      userRole: auth.role,
      targetId: planId,
      targetType: 'membership_plan',
      metadata: { provider: 'square' },
    });

    const idempotencyKey = crypto.randomUUID();
    const paymentLink = await createSquareSubscriptionPaymentLink({
      idempotencyKey,
      subscriptionPlanVariationId: String(plan.squareSubscriptionPlanVariationId),
      locationId,
      checkoutRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
      metadata: { planId, userId: auth.userId, provider: 'square' },
    });

    if (!paymentLink.url) {
      return NextResponse.json({ error: 'Square checkout link was not created.' }, { status: 502 });
    }

    await safeLogAnalyticsEvent({
      eventType: 'square_payment_link_created',
      userId: auth.userId,
      userRole: auth.role,
      targetId: paymentLink.id,
      targetType: 'square_payment_link',
      metadata: { planId },
    });

    return NextResponse.json({ url: paymentLink.url }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create Square checkout link.' }, { status: 500 });
  }
}
