import { sanitizeAnalyticsMetadata } from './wave3-helpers';

export const ANALYTICS_EVENTS = {
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_SUCCESS: 'signup_success',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FROM_GATED_COMPLETED: 'login_from_gated_completed',
  LOGIN_REQUIRED_PROMPT_SHOWN: 'login_required_prompt_shown',
  MEMBERSHIP_REQUIRED_PROMPT_SHOWN: 'membership_required_prompt_shown',
  UPGRADE_REQUIRED_PROMPT_SHOWN: 'upgrade_required_prompt_shown',
  RETURN_TO_ORIGIN_AFTER_LOGIN: 'return_to_origin_after_login',
  LOCKED_CTA_CLICKED: 'locked_cta_clicked',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PROFILE_UPDATED: 'profile_updated',
  MEMBERSHIP_PLAN_VIEWED: 'membership_plan_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  UPGRADE_FLOW_STARTED: 'upgrade_flow_started',
  UPGRADE_FLOW_COMPLETED: 'upgrade_flow_completed',
  SQUARE_PAYMENT_LINK_CREATED: 'square_payment_link_created',
  CHECKOUT_COMPLETED: 'checkout_completed',
  PAYMENT_FAILURE: 'payment_failure',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_REACTIVATED: 'subscription_reactivated',
  MEMBERSHIP_TIER_CHANGED: 'membership_tier_changed',
  MEMBERSHIP_STATUS_CHANGED: 'membership_status_changed',
  MANUAL_OVERRIDE_APPLIED: 'manual_override_applied',
  MANUAL_OVERRIDE_REMOVED: 'manual_override_removed',
  PUBLIC_RESOURCE_VIEWED: 'public_resource_viewed',
  PUBLIC_OFFER_VIEWED: 'public_offer_viewed',
  ARTICLE_VIEWED: 'article_viewed',
  SERVICE_PAGE_VIEWED: 'service_page_viewed',
  RESOURCE_VIEWED: 'resource_viewed',
  RESOURCE_DOWNLOADED: 'resource_downloaded',
  SUITE_ACCESS_SUCCEEDED: 'suite_access_succeeded',
  TOOL_LAUNCHED: 'tool_launched',
  OFFER_REDEEMED: 'offer_redeemed',
  KNOWLEDGE_ARTICLE_VIEWED: 'knowledge_article_viewed',
  PARTNER_OFFER_VIEWED: 'partner_offer_viewed',
  PARTNER_OFFER_CLICKED: 'partner_offer_clicked',
  ANNOUNCEMENT_VIEWED: 'announcement_viewed',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_MARKED_READ: 'notification_marked_read',
  CONTACT_SUBMITTED: 'contact_submitted',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_CONTENT_CREATED: 'admin_content_created',
  ADMIN_CONTENT_UPDATED: 'admin_content_updated',
  ADMIN_CONTENT_DELETED: 'admin_content_deleted',
  ADMIN_CONTENT_PUBLISHED: 'admin_content_published',
  ADMIN_CONTENT_UNPUBLISHED: 'admin_content_unpublished',
  ADMIN_ANNOUNCEMENT_CREATED: 'admin_announcement_created',
  ADMIN_ANNOUNCEMENT_UPDATED: 'admin_announcement_updated',
  ADMIN_ANNOUNCEMENT_DELETED: 'admin_announcement_deleted',
  MEMBER_NOTE_CREATED: 'member_note_created',
  ADMIN_PUBLISH_TRIGGERED: 'admin_publish_triggered',
  CATALOGUE_SEARCH_PERFORMED: 'catalogue_search_performed',
  CATALOGUE_FILTER_APPLIED: 'catalogue_filter_applied',
  CATALOGUE_RESULT_CLICKED: 'catalogue_result_clicked',
  RELATED_RESOURCE_CLICKED: 'related_resource_clicked',
  COMPANION_RESOURCE_CLICKED: 'companion_resource_clicked',
  MEMBER_DASHBOARD_VIEWED: 'member_dashboard_viewed',
  MEMBER_MEMBERSHIP_VIEWED: 'member_membership_viewed',
  MEMBER_BILLING_HISTORY_VIEWED: 'member_billing_history_viewed',
  CUSTOMISATION_REQUEST_SUBMITTED: 'customisation_request_submitted',
  SUPPORT_REQUEST_SUBMITTED: 'support_request_submitted',
  DISCOVERY_CALL_REQUESTED: 'discovery_call_requested',
  STRATEGIC_CHECKUP_REQUESTED: 'strategic_checkup_requested',
  SERVICE_WORKFLOW_STATUS_CHANGED: 'service_workflow_status_changed',
  SERVICE_WORKFLOW_COMPLETED: 'service_workflow_completed',
  RESOURCE_SAVED: 'resource_saved',
  MEMBER_RECENT_ACTIVITY_CLICKED: 'member_recent_activity_clicked',
  PROMOTION_GRANTED: 'promotion_granted',
  PROMOTION_EXPIRED: 'promotion_expired',
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

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
