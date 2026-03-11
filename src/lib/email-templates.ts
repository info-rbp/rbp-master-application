export type EmailTemplateKey =
  | 'welcome'
  | 'verification'
  | 'membership_expiring'
  | 'membership_expired'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'membership_override'
  | 'new_resource_published'
  | 'admin_contact_alert';

export type EmailTemplateContext = {
  appUrl?: string;
  userName?: string;
  verificationUrl?: string;
  membershipEndDate?: string;
  paymentRetryUrl?: string;
  resourceTitle?: string;
  contactName?: string;
  contactEmail?: string;
  contactMessage?: string;
  reason?: string;
};

export type RenderedTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function renderEmailTemplate(
  templateKey: EmailTemplateKey,
  context: EmailTemplateContext = {},
): RenderedTemplate {
  const appUrl = context.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';
  const userName = context.userName ?? 'there';

  switch (templateKey) {
    case 'welcome':
      return {
        subject: 'Welcome to Remote Business Partner',
        text: `Hi ${userName}, welcome to Remote Business Partner. Visit ${appUrl} to get started.`,
        html: `<p>Hi ${userName},</p><p>Welcome to Remote Business Partner.</p><p><a href="${appUrl}">Get started</a>.</p>`,
      };
    case 'verification':
      return {
        subject: 'Verify your email address',
        text: `Hi ${userName}, verify your account: ${context.verificationUrl ?? appUrl}`,
        html: `<p>Hi ${userName},</p><p>Please verify your account.</p><p><a href="${context.verificationUrl ?? appUrl}">Verify email</a></p>`,
      };
    case 'membership_expiring':
      return {
        subject: 'Your membership is expiring soon',
        text: `Your membership expires on ${context.membershipEndDate ?? 'soon'}. Renew at ${appUrl}/membership.`,
        html: `<p>Your membership expires on <strong>${context.membershipEndDate ?? 'soon'}</strong>.</p><p><a href="${appUrl}/membership">Renew membership</a></p>`,
      };
    case 'membership_expired':
      return {
        subject: 'Your membership has expired',
        text: `Your membership has expired. Reactivate at ${appUrl}/membership.`,
        html: `<p>Your membership has expired.</p><p><a href="${appUrl}/membership">Reactivate membership</a></p>`,
      };
    case 'payment_failed':
      return {
        subject: 'Payment failed for your membership',
        text: `We could not process your payment. Retry here: ${context.paymentRetryUrl ?? `${appUrl}/membership`}.`,
        html: `<p>We could not process your membership payment.</p><p><a href="${context.paymentRetryUrl ?? `${appUrl}/membership`}">Retry payment</a></p>`,
      };
    case 'subscription_canceled':
      return {
        subject: 'Your subscription has been canceled',
        text: 'Your subscription was canceled. You can reactivate anytime from your account.',
        html: '<p>Your subscription was canceled. You can reactivate anytime from your account.</p>',
      };
    case 'membership_override':
      return {
        subject: 'Your membership was updated by support',
        text: `An administrator updated your membership.${context.reason ? ` Reason: ${context.reason}` : ''}`,
        html: `<p>An administrator updated your membership.</p>${context.reason ? `<p>Reason: ${context.reason}</p>` : ''}`,
      };
    case 'new_resource_published':
      return {
        subject: 'New resource published',
        text: `A new resource is available: ${context.resourceTitle ?? 'New resource'}. Visit ${appUrl}/docushare.`,
        html: `<p>A new resource is available: <strong>${context.resourceTitle ?? 'New resource'}</strong>.</p><p><a href="${appUrl}/docushare">View resource</a></p>`,
      };
    case 'admin_contact_alert':
      return {
        subject: `New contact enquiry from ${context.contactName ?? 'website visitor'}`,
        text: `Name: ${context.contactName ?? '-'}\nEmail: ${context.contactEmail ?? '-'}\nMessage: ${context.contactMessage ?? '-'}`,
        html: `<p><strong>Name:</strong> ${context.contactName ?? '-'}</p><p><strong>Email:</strong> ${context.contactEmail ?? '-'}</p><p><strong>Message:</strong> ${context.contactMessage ?? '-'}</p>`,
      };
    default:
      return {
        subject: 'Remote Business Partner update',
        text: 'You have a new update.',
        html: '<p>You have a new update.</p>',
      };
  }
}
