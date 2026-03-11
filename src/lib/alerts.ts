import { createNotification } from './notifications';
import { sendTemplatedEmail } from './email';
import { trackEvent } from './analytics';

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
    type: input.type === 'payment_failed' ? 'payment' : 'membership',
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    severity: input.type === 'payment_failed' ? 'error' : 'warning',
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

  await trackEvent({
    eventType: 'membership_status_changed',
    userId: input.userId,
    role: 'member',
    metadata: { alertType: input.type },
  });
}

export async function triggerAdminAlert(input: {
  type: 'enquiry' | 'resource' | 'payment' | 'membership' | 'email_failure';
  title: string;
  message: string;
  actionUrl?: string;
}) {
  await createNotification({
    audienceRole: 'admin',
    type: input.type,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl,
    severity: input.type === 'email_failure' || input.type === 'payment' ? 'error' : 'info',
  });
}
