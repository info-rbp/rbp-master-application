import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/server';
import { trackEvent } from '@/lib/analytics';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { planId?: string; userId?: string };
    const planId = body.planId?.trim();
    const userId = body.userId?.trim();

    if (!planId) {
      return NextResponse.json({ error: 'planId is required.' }, { status: 400 });
    }

    const planSnapshot = await firestore.collection('membership_plans').doc(planId).get();
    if (!planSnapshot.exists) {
      return NextResponse.json({ error: 'Membership plan not found.' }, { status: 404 });
    }

    const plan = planSnapshot.data();
    if (!plan?.stripePriceId) {
      return NextResponse.json({ error: 'Selected plan is not configured for Stripe checkout.' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not configured.' }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL is not configured.' }, { status: 500 });
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    await trackEvent({ eventType: 'membership_checkout_started', userId, role: 'member', metadata: { planId } });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId as string, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership/subscribe`,
      metadata: {
        planId,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe checkout session did not return a URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session.',
      },
      { status: 500 },
    );
  }
}
