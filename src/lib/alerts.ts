import { createNotification } from './notifications';
import { sendTemplatedEmail, type EmailSendResult } from './email';
import { safeLogAnalyticsEvent } from './analytics-server';

type MembershipAlertType =
  | 'membership_expiring'
  | 'membership_expired'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'subscription_reactivated'
  | 'membership_override';

async function alertOnEmailFailure(result: EmailSendResult, context: { triggerSource: string; userId?: string }) {
  if (result.ok) return;
  await createNotification({
    audienceRole: 'admin',
    audienceType: 'role',
    type: 'failed_email_send',
    title: 'Email delivery failed',
    message: `${context.triggerSource}: ${result.reason}`,
    actionUrl: '/admin/notifications',
    severity: 'error',
    metadata: {
      triggerSource: context.triggerSource,
      userId: context.userId,
      emailLogId: result.logId,
    },
  });
}

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

  const result = await sendTemplatedEmail({
    recipient: input.email,
    templateKey: input.type,
    triggerSource: 'membership_lifecycle',
    relatedUserId: input.userId,
    relatedEntityId: input.userId,
    relatedEntityType: 'user',
    context: {
      membershipEndDate: input.membershipEndDate,
      reason: input.reason,
      paymentRetryUrl: input.actionUrl,
    },
  });

  await alertOnEmailFailure(result, {
    triggerSource: `membership_lifecycle:${input.type}`,
    userId: input.userId,
  });

  await safeLogAnalyticsEvent({
    eventType: 'membership_status_changed',
    userId: input.userId,
    userRole: 'member',
    targetType: 'membership',
    metadata: { alertType: input.type, emailStatus: result.status },
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
