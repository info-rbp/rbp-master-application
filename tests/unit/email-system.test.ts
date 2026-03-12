import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailService, validateEmailProviderConfig } from '../../src/lib/email';
import { renderEmailTemplate } from '../../src/lib/email-templates';

test('validateEmailProviderConfig fails when credentials are missing', () => {
  const result = validateEmailProviderConfig({} as NodeJS.ProcessEnv);
  assert.equal(result.valid, false);
});

test('sendEmail returns skipped and logs when config is missing', async () => {
  const logs: Record<string, unknown>[] = [];
  const service = createEmailService({
    addLog: async (entry) => {
      logs.push(entry);
      return 'log-1';
    },
    providerRequest: fetch,
    env: {} as NodeJS.ProcessEnv,
  });

  const result = await service.sendEmail({
    recipient: 'member@example.com',
    subject: 'Hello',
    html: '<p>Hi</p>',
    triggerSource: 'test',
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'skipped');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].status, 'skipped');
});

test('sendTemplatedEmail returns sent on provider success', async () => {
  const logs: Record<string, unknown>[] = [];
  const service = createEmailService({
    addLog: async (entry) => {
      logs.push(entry);
      return 'log-2';
    },
    providerRequest: async () => new Response('{}', { status: 200 }),
    env: {
      EMAIL_PROVIDER_API_KEY: 'key',
      EMAIL_FROM_ADDRESS: 'ops@example.com',
      NODE_ENV: 'test',
    } as NodeJS.ProcessEnv,
  });

  const result = await service.sendTemplatedEmail({
    recipient: 'member@example.com',
    templateKey: 'welcome',
    triggerSource: 'signup',
  });

  assert.equal(result.ok, true);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].status, 'sent');
});

test('renderEmailTemplate escapes risky HTML fields', () => {
  const output = renderEmailTemplate('admin_contact_alert', {
    contactName: '<script>alert(1)</script>',
    contactEmail: 'attacker@example.com',
    contactMessage: '<img src=x onerror=alert(1) />',
  });

  assert.equal(output.html.includes('<script>'), false);
  assert.equal(output.html.includes('<img src=x onerror=alert(1) />'), false);
});
