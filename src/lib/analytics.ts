import { firestore } from '@/firebase/server';
import { sanitizeAnalyticsMetadata } from './wave3-helpers';

export type AnalyticsEventType =
  | 'new_signup'
  | 'login'
  | 'failed_login'
  | 'resource_view'
  | 'resource_download'
  | 'knowledge_article_view'
  | 'partner_offer_click'
  | 'contact_enquiry_submitted'
  | 'membership_checkout_started'
  | 'membership_checkout_completed'
  | 'membership_status_changed'
  | 'admin_content_published'
  | 'admin_login';

export type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  userId?: string;
  role?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
};

export async function trackEvent(event: AnalyticsEvent) {
  try {
    await firestore.collection('analytics_events').add({
      ...event,
      metadata: sanitizeAnalyticsMetadata(event.metadata),
      createdAt: new Date(),
    });
    return { ok: true as const };
  } catch (error) {
    console.error('Failed to track analytics event', error);
    return { ok: false as const };
  }
}

export async function getAnalyticsEvents(eventType?: AnalyticsEventType) {
  let query: FirebaseFirestore.Query = firestore.collection('analytics_events');

  if (eventType) {
    query = query.where('eventType', '==', eventType);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

