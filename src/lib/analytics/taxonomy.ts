
export type AnalyticsEventCategory = 'product' | 'commercial' | 'operational' | 'integration';

export interface AnalyticsEvent {
  name: string;
  category: AnalyticsEventCategory;
  payload: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
};

export const EventNames = {
  // Page/Screen Views
  PAGE_VIEW: 'page_view',

  // Commercial Events
  MEMBERSHIP_SIGNUP_STARTED: 'membership_signup_started',
  MEMBERSHIP_SIGNUP_COMPLETED: 'membership_signup_completed',
  SUBSCRIPTION_PURCHASE_SUCCESS: 'subscription_purchase_success',
  SUBSCRIPTION_PURCHASE_FAILURE: 'subscription_purchase_failure',
  PROMOTION_APPLIED: 'promotion_applied',

  // Product Engagement Events
  TOOL_EXECUTION_STARTED: 'tool_execution_started',
  TOOL_EXECUTION_COMPLETED: 'tool_execution_completed',
  DOCUMENT_GENERATED: 'document_generated',
  RESOURCE_DOWNLOADED: 'resource_downloaded',
  SEARCH_PERFORMED: 'search_performed',

  // Account & Auth Events
  USER_LOGIN_SUCCESS: 'user_login_success',
  USER_LOGIN_FAILURE: 'user_login_failure',
  USER_LOGOUT: 'user_logout',
  EMAIL_VERIFICATION_SENT: 'email_verification_sent',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',

  // Operational & Admin Events
  ADMIN_ACTION: 'admin_action', // e.g., content published, user role changed
  SUPPORT_TICKET_CREATED: 'support_ticket_created',

  // Integration Events
  SQUARE_WEBHOOK_RECEIVED: 'square_webhook_received',
  SQUARE_WEBHOOK_FAILURE: 'square_webhook_failure',
};
