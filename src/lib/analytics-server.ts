import { firestore } from '@/firebase/server';
import { type AnalyticsEvent, type AnalyticsEventType, buildAnalyticsEventRecord } from './analytics-events';

export async function logAnalyticsEvent(event: AnalyticsEvent) {
  await firestore.collection('analytics_events').add(buildAnalyticsEventRecord(event));
}

export async function safeLogAnalyticsEvent(event: AnalyticsEvent) {
  try {
    await logAnalyticsEvent(event);
    return { ok: true as const };
  } catch (error) {
    console.error('Failed to log analytics event', error);
    return { ok: false as const };
  }
}

export async function getAnalyticsEvents(eventType?: AnalyticsEventType) {
  let query: FirebaseFirestore.Query = firestore.collection('analytics_events');
  if (eventType) {
    query = query.where('eventType', '==', eventType);
  }
  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getEventCountByType(eventType: AnalyticsEventType) {
  const snapshot = await firestore.collection('analytics_events').where('eventType', '==', eventType).get();
  return snapshot.size;
}
