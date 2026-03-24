import { firestore } from '@/firebase/server';

export interface Promotion {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    applicableTo: 'all' | string[]; // 'all' or an array of plan codes
    status: 'active' | 'expired' | 'revoked';
    createdAt: string;
    updatedAt: string;
}

export async function getPromotionByCode(code: string): Promise<Promotion | null> {
    const snapshot = await firestore.collection('promotions').where('code', '==', code).limit(1).get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
        id: doc.id,
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableTo: data.applicableTo,
        status: data.status,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
    };
}

export async function applyPromotion(planPrice: number, promotion: Promotion): Promise<number> {
    if (promotion.status !== 'active') {
        throw new Error('This promotion is not active.');
    }

    if (promotion.discountType === 'percentage') {
        return planPrice * (1 - promotion.discountValue / 100);
    } else if (promotion.discountType === 'fixed') {
        return Math.max(0, planPrice - promotion.discountValue);
    }

    return planPrice;
}


export async function expirePromotionalGrants(_input: { userId?: string; now?: string } = {}): Promise<{ expired: number }> {
  return { expired: 0 };
}

export async function grantStandardTrialFromServicePurchase(_input: {
  userId: string;
  relatedEntityId?: string;
  reason?: string;
}): Promise<{ granted: boolean; grantId?: string }> {
  return { granted: false };
}
