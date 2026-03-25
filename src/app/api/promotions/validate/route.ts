import { NextResponse } from 'next/server';
import { getPromotionByCode, applyPromotion } from '@/lib/promotions';

export async function POST(request: Request) {
    const { code, planPrice } = await request.json();

    if (!code || !planPrice) {
        return NextResponse.json({ error: 'Missing code or plan price' }, { status: 400 });
    }

    try {
        const promotion = await getPromotionByCode(code);

        if (!promotion) {
            return NextResponse.json({ error: 'Invalid promotion code' }, { status: 404 });
        }

        const discountedPrice = await applyPromotion(planPrice, promotion);

        return NextResponse.json({ discountedPrice });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
