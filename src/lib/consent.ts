
import { firestore } from '@/firebase/server';
import { getServerAuthContext } from './server-auth';

export type ConsentType = 'marketing' | 'product_updates';

export interface ConsentRecord {
  userId: string;
  type: ConsentType;
  granted: boolean;
  timestamp: string;
}

/**
 * Records a user's consent for a specific communication type.
 * @param userId The ID of the user.
 * @param type The type of consent being granted or revoked.
 * @param granted Whether the user is granting or revoking consent.
 */
export async function recordConsent(userId: string, type: ConsentType, granted: boolean): Promise<void> {
  const consentRef = firestore.collection('consents').doc(`${userId}_${type}`);
  await consentRef.set({
    userId,
    type,
    granted,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Retrieves a user's consent status for a specific communication type.
 * @param userId The ID of the user.
 * @param type The type of consent to check.
 * @returns The consent record, or null if no record exists.
 */
export async function getConsent(userId: string, type: ConsentType): Promise<ConsentRecord | null> {
  const consentRef = firestore.collection('consents').doc(`${userId}_${type}`);
  const doc = await consentRef.get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as ConsentRecord;
}

/**
 * Updates the marketing email consent for the currently authenticated user.
 * @param granted Whether to grant or revoke consent for marketing emails.
 */
export async function updateMarketingConsent(granted: boolean): Promise<void> {
  const auth = await getServerAuthContext();
  if (!auth) {
    throw new Error('Unauthorized');
  }

  await recordConsent(auth.userId, 'marketing', granted);
}
