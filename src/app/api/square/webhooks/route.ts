import { NextRequest, NextResponse } from 'next/server';
import { processSquareEvent } from '@/lib/billing';
import { verifySquareWebhookSignature } from '@/lib/square';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-square-hmacsha256-signature');
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhooks`;

  const isValid = verifySquareWebhookSignature({
    body: rawBody,
    signature,
    notificationUrl,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const result = await processSquareEvent(event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Webhook processing failed.' }, { status: 500 });
  }
}
