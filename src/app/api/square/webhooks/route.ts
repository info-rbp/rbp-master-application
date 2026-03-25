
import { NextRequest, NextResponse } from 'next/server';
import { isValidSquareWebhook } from '@/lib/square';
import { UserProfile, Subscription, BillingHistory, MembershipHistory } from '@/lib/square-webhook-types.ts';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/server';

export async function POST(req: NextRequest) {
    const signature = req.headers.get('x-square-signature') as string;
    const body = await req.text();
    const secret = process.env.SQUARE_WEBHOOK_SECRET as string;
    const notificationUrl = req.url;

    const isValid = await isValidSquareWebhook(notificationUrl, body, signature, secret);

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const notification = JSON.parse(body);

    // Idempotency check
    const eventId = notification.id;
    const eventRef = doc(db, "processed_events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists()) {
        return NextResponse.json({ status: 'Event already processed' });
    }

    if (notification.type === 'payment.updated') {
        const payment = notification.data.object.payment;

        if (payment.status === 'COMPLETED') {
            const orderId = payment.order_id;
            const customerId = payment.customer_id;
            const amount = payment.amount_money.amount;

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("squareCustomerId", "==", customerId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error(`User with squareCustomerId ${customerId} not found.`);
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { membershipStatus: 'active' });

            const subscription: Subscription = {
                subscriptionId: orderId, 
                userId,
                tier: 'premium', 
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                status: 'active',
            };
            await addDoc(collection(db, "subscriptions"), subscription);

            const billing: BillingHistory = {
                paymentId: payment.id,
                userId,
                amount,
                date: new Date(),
                status: 'completed',
            };
            await addDoc(collection(db, "billing_history"), billing);

            const membership: MembershipHistory = {
                userId,
                changeType: 'activated',
                timestamp: new Date(),
                details: `Membership activated via Square payment ${payment.id}`,
            };
            await addDoc(collection(db, "membership_history"), membership);

            await setDoc(eventRef, { timestamp: new Date() });
        }
    }

    return NextResponse.json({ status: 'success' });
}
