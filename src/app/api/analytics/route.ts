import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/server';
import { AnalyticsEvent } from '@/lib/analytics/taxonomy';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    const body = await request.json();

    const event: AnalyticsEvent = {
        ...body,
        timestamp: Timestamp.now(),
    };

    if (!event.name || !event.category || !event.payload) {
        return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    try {
        await firestore.collection('analyticsEvents').add(event);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error writing analytics event to Firestore:', error);
        return NextResponse.json({ error: 'Could not process event' }, { status: 500 });
    }
}
