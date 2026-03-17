import { NextRequest, NextResponse } from 'next/server';
import { trackClick } from '@/lib/tracking';
import { Click } from '@/lib/tracking/types';

export async function POST(req: NextRequest) {
    const { partnerId, offerId, userId } = await req.json() as Omit<Click, 'id' | 'timestamp'>;

    if (!partnerId || !offerId || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const click = await trackClick({ partnerId, offerId, userId });
        return NextResponse.json(click);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
    }
}
