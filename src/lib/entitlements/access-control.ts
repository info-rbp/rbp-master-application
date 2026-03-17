import { firestore } from '@/firebase/server';
import { AccessGrant, AccessTier, TIER_HIERARCHY } from './access-grant';

/**
 * Retrieves the highest active access grant for a user.
 * @param userId The user's ID.
 * @returns The active access grant with the highest tier, or null if none is found.
 */
export async function getUserAccessGrant(userId: string): Promise<AccessGrant | null> {
  const grantsRef = firestore.collection('users').doc(userId).collection('accessGrants');
  const snapshot = await grantsRef.where('expiresAt', '>', new Date()).get();

  if (snapshot.empty) {
    return null;
  }

  let highestGrant: AccessGrant | null = null;
  snapshot.docs.forEach(doc => {
    const grant = doc.data() as AccessGrant;
    if (!highestGrant || TIER_HIERARCHY[grant.tier] > TIER_HIERARCHY[highestGrant.tier]) {
      highestGrant = grant;
    }
  });

  return highestGrant;
}

/**
 * Checks if a user's tier is sufficient to meet a required tier.
 * @param userTier The user's access tier.
 * @param requiredTier The required access tier.
 * @returns True if the user's tier is sufficient, false otherwise.
 */
export function hasSufficientTier(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}
