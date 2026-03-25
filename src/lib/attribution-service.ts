
import { firestore } from '@/firebase/server';

export interface ConversionEvent {
  id: string;
  userId: string;
  conversionType: 'signup' | 'purchase';
  timestamp: string;
  source: string; // e.g., 'organic', 'partner_referral'
  partnerId?: string;
  revenue?: number;
}

const db = firestore;
const conversionEventsCollection = db.collection('conversion_events');
const userJourneyCollection = db.collection('user_journeys');

/**
 * Tracks a user's touchpoint in their journey.
 * @param userId The ID of the user.
 * @param source The source of the touchpoint (e.g., a partner referral link).
 * @param partnerId The ID of the partner, if applicable.
 */
export async function trackUserTouchpoint(userId: string, source: string, partnerId?: string): Promise<void> {
  const now = new Date().toISOString();
  // In a real system, you might store a series of touchpoints for a user.
  // For simplicity, we'll store the last touchpoint.
  await userJourneyCollection.doc(userId).set({
    userId,
    lastTouchpoint: {
      source,
      partnerId,
      timestamp: now,
    },
  });
}

/**
 * Logs a conversion event and attributes it to the last known touchpoint.
 * @param userId The ID of the user who converted.
 * @param conversionType The type of conversion.
 * @param revenue The revenue generated from the conversion, if applicable.
 */
export async function logConversion(userId: string, conversionType: 'signup' | 'purchase', revenue?: number): Promise<ConversionEvent> {
  const id = db.collection('_').doc().id;
  const now = new Date().toISOString();

  // Get the user's last touchpoint
  const userJourneyDoc = await userJourneyCollection.doc(userId).get();
  const lastTouchpoint = userJourneyDoc.exists ? userJourneyDoc.data()?.lastTouchpoint : null;

  const conversion: ConversionEvent = {
    id,
    userId,
    conversionType,
    timestamp: now,
    source: lastTouchpoint?.source || 'organic',
    partnerId: lastTouchpoint?.partnerId,
    revenue,
  };

  await conversionEventsCollection.doc(id).set(conversion);

  // If it was a partner referral, you might trigger a commission calculation here.

  return conversion;
}
