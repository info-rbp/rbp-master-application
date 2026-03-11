import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEmailTemplate } from '@/lib/email-templates';
import {
  buildAuditSummary,
  computeConversionRate,
  getUnreadCount,
  sanitizeAnalyticsMetadata,
} from '@/lib/wave3-helpers';

test('computeConversionRate calculates percentage safely', () => {
  assert.equal(computeConversionRate(0, 10), 0);
  assert.equal(computeConversionRate(20, 5), 25);
});

test('renderEmailTemplate returns required template output', () => {
  const template = renderEmailTemplate('welcome', { userName: 'Pat', appUrl: 'https://app.test' });
  assert.match(template.subject, /Welcome/);
  assert.match(template.text, /Pat/);
});

test('sanitizeAnalyticsMetadata removes undefined fields', () => {
  const sanitized = sanitizeAnalyticsMetadata({ ok: true, ignore: undefined });
  assert.deepEqual(sanitized, { ok: true });
});

test('getUnreadCount counts unread notifications', () => {
  assert.equal(getUnreadCount([{ readAt: '2024-01-01' }, {}]), 1);
});

test('buildAuditSummary formats audit markers', () => {
  assert.equal(buildAuditSummary('plan_update', 'membership_plan', 'plan_1'), 'plan_update:membership_plan:plan_1');
});
