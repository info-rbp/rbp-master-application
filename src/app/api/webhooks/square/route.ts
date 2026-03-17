'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

// A utility function to verify the signature
async function verifySignature(request: NextRequest, secret: string): Promise<boolean> {
    const signature = request.headers.get('x-square-hmacsha256-signature');
    if (!signature) {
        return false;
    }

    const url = request.url;
    const body = await request.text();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(url + body);
    const hash = hmac.digest('base64');

    return hash === signature;
}

export async function POST(request: NextRequest) {
    const squareWebhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
    if (!squareWebhookSecret) {
        console.error('SQUARE_WEBHOOK_SECRET is not set.');
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    // Cloned request to be able to read the body twice
    const clonedRequest = request.clone();

    // First, verify the signature
    const isVerified = await verifySignature(request, squareWebhookSecret);
    if (!isVerified) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const event = await clonedRequest.json();
    const eventId = event.event_id;

    // Idempotency check
    const eventRef = doc(db, 'square_webhook_events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
        // Event has been processed before
        return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // Store the event to prevent reprocessing
    await setDoc(eventRef, { receivedAt: new Date(), status: 'received' });

    // Process the event based on its type
    switch (event.type) {
        case 'invoice.payment_made':
            // TODO: Handle payment success, update user subscription
            console.log('Payment made for invoice:', event.data.object.invoice.id);
            break;
        case 'invoice.payment_failed':
            // TODO: Handle payment failure, notify user
            console.log('Payment failed for invoice:', event.data.object.invoice.id);
            break;
        // Add other event types as needed
        default:
            console.log('Unhandled event type:', event.type);
    }

    // Update the event status to processed
    await setDoc(eventRef, { status: 'processed' }, { merge: true });

    return NextResponse.json({ success: true });
}
