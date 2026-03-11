import { createNotification } from './notifications';
import { sendTemplatedEmail } from './email';
import { safeLogAnalyticsEvent } from './analytics';

type MembershipAlertType =
  | 'membership_expiring'
  | 'membership_expired'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'membership_override';

export async function triggerMembershipAlert(input: {
  type: MembershipAlertType;
  userId: string;
  email: string;
  title: string;
  message: string;
  actionUrl?: string;
  membershipEndDate?: string;
  reason?: string;
}) {
  await createNotification({
    userId: input.userId,
    audienceRole: 'member',
    audienceType: 'direct',
    type: input.type,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    severity: input.type === 'payment_failed' ? 'error' : 'warning',
    metadata: { reason: input.reason },
  });

  await sendTemplatedEmail({
    recipient: input.email,
    templateKey: input.type,
    context: {
      membershipEndDate: input.membershipEndDate,
      reason: input.reason,
      paymentRetryUrl: input.actionUrl,
    },
  });

  await safeLogAnalyticsEvent({
    eventType: 'membership_status_changed',
    userId: input.userId,
    userRole: 'member',
    targetType: 'membership',
    metadata: { alertType: input.type },
  });
}

export async function triggerAdminAlert(input: {
  type: 'new_contact_enquiry' | 'resource_published' | 'payment_failed' | 'membership_expiring' | 'failed_email_send' | 'new_signup';
  title: string;
  message: string;
  actionUrl?: string;
}) {
  await createNotification({
    audienceRole: 'admin',
    audienceType: 'role',
    type: input.type,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    severity: input.type === 'failed_email_send' || input.type === 'payment_failed' ? 'error' : 'info',
  });
}
