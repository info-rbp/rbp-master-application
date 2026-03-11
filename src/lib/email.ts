import { firestore } from '@/firebase/server';
import { renderEmailTemplate, type EmailTemplateContext, type EmailTemplateKey } from './email-templates';

export type EmailAttempt = {
  recipient: string;
  templateKey: EmailTemplateKey;
  context?: EmailTemplateContext;
};

type EmailLogStatus = 'sent' | 'failed' | 'skipped';

async function logEmailAttempt(input: {
  status: EmailLogStatus;
  recipient: string;
  subject: string;
  templateKey: EmailTemplateKey;
  error?: string;
}) {
  await firestore.collection('email_logs').add({
    ...input,
    sentAt: new Date(),
  });
}

async function sendWithResend(recipient: string, subject: string, html: string) {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !fromEmail) {
    throw new Error('Missing EMAIL_PROVIDER_API_KEY or EMAIL_FROM_ADDRESS');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipient,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider rejected request (${response.status}): ${body}`);
  }
}

export async function sendTemplatedEmail({ recipient, templateKey, context }: EmailAttempt) {
  const template = renderEmailTemplate(templateKey, context);

  try {
    if (!process.env.EMAIL_PROVIDER_API_KEY || !process.env.EMAIL_FROM_ADDRESS) {
      await logEmailAttempt({
        status: 'skipped',
        recipient,
        subject: template.subject,
        templateKey,
        error: 'Missing email provider configuration',
      });
      return { ok: false, reason: 'missing_configuration' as const };
    }

    await sendWithResend(recipient, template.subject, template.html);

    await logEmailAttempt({
      status: 'sent',
      recipient,
      subject: template.subject,
      templateKey,
    });

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await logEmailAttempt({
      status: 'failed',
      recipient,
      subject: template.subject,
      templateKey,
      error: message,
    });

    return { ok: false as const, reason: message };
  }
}
