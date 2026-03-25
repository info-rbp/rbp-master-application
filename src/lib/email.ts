export interface Email {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export type EmailSendResult = {
  delivered: boolean;
  provider: 'console';
};

export async function sendEmail(email: Email): Promise<EmailSendResult> {
  console.log('Sending email:', email);
  return {
    delivered: true,
    provider: 'console',
  };
}

export async function sendTemplatedEmail(input: {
  to: string;
  template: string;
  variables?: Record<string, unknown>;
  subject?: string;
  from?: string;
}): Promise<EmailSendResult> {
  const subject = input.subject ?? `RBP notification: ${input.template}`;
  const html = `<pre>${JSON.stringify(input.variables ?? {}, null, 2)}</pre>`;
  return sendEmail({
    to: input.to,
    from: input.from ?? 'noreply@rbp.local',
    subject,
    html,
  });
}
