'use server';

import { firestore } from '@/firebase/server';
import { AccessGrant, AccessTier } from '@/lib/entitlements/access-grant';
import { revalidatePath } from 'next/cache';

export async function grantAccessTier(userId: string, tier: string, source: string, expiresAt?: Date) {
    const grantRef = firestore.collection('users').doc(userId).collection('accessGrants').doc();
    const newGrant: AccessGrant = {
        id: grantRef.id,
        userId,
        tier: tier as AccessTier,
        source,
        createdAt: new Date(),
        expiresAt,
    };
    await grantRef.set(newGrant);
    revalidatePath('/admin/entitlements');
}

export async function revokeAccessGrant(userId: string, grantId: string) {
    await firestore.collection('users').doc(userId).collection('accessGrants').doc(grantId).delete();
    revalidatePath('/admin/entitlements');
}
