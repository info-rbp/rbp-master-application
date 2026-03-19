import { firestore } from '@/firebase/server';
import type { AnalyticsEvent } from '@/lib/analytics/taxonomy';

type FirestoreTimestampLike = {
  toDate?: () => Date;
};

export async function getAdminAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const snapshot = await firestore.collection('analyticsEvents').orderBy('timestamp', 'desc').get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as AnalyticsEvent & { timestamp?: string | Date | FirestoreTimestampLike | null };
    const timestamp = data.timestamp;

    let serializedTimestamp: string | undefined;
    if (typeof timestamp === 'string') {
      serializedTimestamp = timestamp;
    } else if (timestamp instanceof Date) {
      serializedTimestamp = timestamp.toISOString();
    } else if (timestamp && typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
      serializedTimestamp = timestamp.toDate().toISOString();
    }

    return {
      name: data.name,
      category: data.category,
      payload: data.payload ?? {},
      timestamp: serializedTimestamp,
      userId: data.userId,
      sessionId: data.sessionId,
    };
  });
}
