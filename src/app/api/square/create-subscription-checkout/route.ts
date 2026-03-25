
import { NextRequest, NextResponse } from 'next/server';
import { Client, Environment } from 'square';

const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: 'Premium Plan',
        priceMoney: {
          amount: 9900,
          currency: 'USD',
        },
        locationId: process.env.SQUARE_LOCATION_ID as string,
      },
      checkoutOptions: {
        allowTipping: false,
        redirectUrl: `http://localhost:3000/portal/subscription?success=true`,
        askForShippingAddress: false,
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: false,
          creditCard: true,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: response.result.paymentLink?.url });
  } catch (error) {
    console.error('Error creating Square checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
