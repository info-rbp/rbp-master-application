import { firestore } from '@/firebase/server';
import { sanitizeAnalyticsMetadata } from './wave3-helpers';

export type AnalyticsEventType =
  | 'signup_success'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'profile_updated'
  | 'membership_plan_viewed'
  | 'checkout_started'
  | 'square_payment_link_created'
  | 'checkout_completed'
  | 'payment_failure'
  | 'payment_succeeded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_canceled'
  | 'subscription_reactivated'
  | 'membership_tier_changed'
  | 'membership_status_changed'
  | 'manual_override_applied'
  | 'manual_override_removed'
  | 'resource_viewed'
  | 'resource_downloaded'
  | 'knowledge_article_viewed'
  | 'partner_offer_viewed'
  | 'partner_offer_clicked'
  | 'announcement_viewed'
  | 'notification_opened'
  | 'notification_marked_read'
  | 'contact_submitted'
  | 'admin_login'
  | 'admin_content_created'
  | 'admin_content_updated'
  | 'admin_content_deleted'
  | 'admin_announcement_created'
  | 'admin_announcement_updated'
  | 'admin_announcement_deleted'
  | 'member_note_created'
  | 'admin_publish_triggered';

export type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  userId?: string;
  userRole?: 'member' | 'admin';
  targetId?: string;
  targetType?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

export function buildAnalyticsEventRecord(event: AnalyticsEvent) {
  return {
    ...event,
    metadata: sanitizeAnalyticsMetadata(event.metadata),
    createdAt: new Date(),
  };
}

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
