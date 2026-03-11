import { firestore } from '@/firebase/server';
import {
  renderEmailTemplate,
  type EmailTemplateContext,
  type EmailTemplateKey,
} from './email-templates';

export type EmailLogStatus = 'queued' | 'sent' | 'failed' | 'skipped';

type EmailProvider = 'resend';

export type EmailSendInput = {
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  templateKey?: EmailTemplateKey;
  triggerSource: string;
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, unknown>;
};

export type EmailAttemptLog = {
  recipient: string;
  subject: string;
  templateKey: EmailTemplateKey | 'raw';
  provider: EmailProvider;
  status: EmailLogStatus;
  reason?: string;
  triggerSource: string;
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, unknown>;
};

export type EmailSendResult =
  | { ok: true; status: 'sent'; provider: EmailProvider; logId: string }
  | { ok: false; status: 'failed' | 'skipped'; provider: EmailProvider; reason: string; logId: string };

export type TemplatedEmailInput = {
  recipient: string;
  templateKey: EmailTemplateKey;
  context?: EmailTemplateContext;
  triggerSource: string;
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, unknown>;
};

export type EmailServiceDependencies = {
  addLog: (entry: Record<string, unknown>) => Promise<string>;
  providerRequest: typeof fetch;
  env: NodeJS.ProcessEnv;
};

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

export function validateEmailProviderConfig(env: NodeJS.ProcessEnv) {
  const apiKey = env.EMAIL_PROVIDER_API_KEY?.trim();
  const fromAddress = env.EMAIL_FROM_ADDRESS?.trim();
  if (!apiKey || !fromAddress) {
    return {
      valid: false as const,
      reason: 'Missing EMAIL_PROVIDER_API_KEY or EMAIL_FROM_ADDRESS',
    };
  }

  return {
    valid: true as const,
    config: {
      apiKey,
      fromAddress,
    },
  };
}

export function createEmailService(deps: EmailServiceDependencies) {
  const provider: EmailProvider = 'resend';

  async function logEmailAttempt(input: EmailAttemptLog) {
    return deps.addLog({
      ...input,
      metadata: sanitizeMetadata(input.metadata),
      createdAt: new Date(),
      sentAt: input.status === 'sent' ? new Date() : null,
      errorMessage: input.reason ?? null,
    });
  }

  async function sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    const config = validateEmailProviderConfig(deps.env);
    const templateKey = input.templateKey ?? 'raw';

    if (!config.valid) {
      const logId = await logEmailAttempt({
        recipient: input.recipient,
        subject: input.subject,
        templateKey,
        provider,
        status: 'skipped',
        reason: config.reason,
        triggerSource: input.triggerSource,
        relatedUserId: input.relatedUserId,
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        metadata: input.metadata,
      });

      return { ok: false, status: 'skipped', reason: config.reason, provider, logId };
    }

    try {
      const response = await deps.providerRequest('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.config.fromAddress,
          to: input.recipient,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        const reason = `Provider rejected request (${response.status})${body ? `: ${body.slice(0, 200)}` : ''}`;
        const logId = await logEmailAttempt({
          recipient: input.recipient,
          subject: input.subject,
          templateKey,
          provider,
          status: 'failed',
          reason,
          triggerSource: input.triggerSource,
          relatedUserId: input.relatedUserId,
          relatedEntityId: input.relatedEntityId,
          relatedEntityType: input.relatedEntityType,
          metadata: input.metadata,
        });
        return { ok: false, status: 'failed', reason, provider, logId };
      }

      const logId = await logEmailAttempt({
        recipient: input.recipient,
        subject: input.subject,
        templateKey,
        provider,
        status: 'sent',
        triggerSource: input.triggerSource,
        relatedUserId: input.relatedUserId,
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        metadata: input.metadata,
      });

      return { ok: true, status: 'sent', provider, logId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown provider error';
      const logId = await logEmailAttempt({
        recipient: input.recipient,
        subject: input.subject,
        templateKey,
        provider,
        status: 'failed',
        reason,
        triggerSource: input.triggerSource,
        relatedUserId: input.relatedUserId,
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
        metadata: input.metadata,
      });
      return { ok: false, status: 'failed', reason, provider, logId };
    }
  }

  async function sendTemplatedEmail(input: TemplatedEmailInput): Promise<EmailSendResult> {
    const rendered = renderEmailTemplate(input.templateKey, input.context);

    return sendEmail({
      recipient: input.recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateKey: input.templateKey,
      triggerSource: input.triggerSource,
      relatedUserId: input.relatedUserId,
      relatedEntityId: input.relatedEntityId,
      relatedEntityType: input.relatedEntityType,
      metadata: input.metadata,
    });
  }

  return { sendEmail, sendTemplatedEmail, logEmailAttempt };
}

const emailService = createEmailService({
  addLog: async (entry) => {
    const ref = await firestore.collection('email_logs').add(entry);
    return ref.id;
  },
  providerRequest: fetch,
  env: process.env,
});

export const sendEmail = emailService.sendEmail;
export const sendTemplatedEmail = emailService.sendTemplatedEmail;
export const logEmailAttempt = emailService.logEmailAttempt;
