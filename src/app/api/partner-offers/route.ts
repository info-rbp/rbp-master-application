import { NextRequest, NextResponse } from 'next/server';
import { getPartnerOffers, getPartnerOffer } from '@/lib/partner-offers';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
        const offer = await getPartnerOffer(id);
        if (offer) {
            return NextResponse.json(offer);
        } else {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }
    } else {
        const offers = await getPartnerOffers();
        return NextResponse.json(offers);
    }
}
