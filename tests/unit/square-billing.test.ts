import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlanForSquareCheckout, normalizeMembershipStatusFromSquare } from '@/lib/subscriptions';
import { verifySquareWebhookSignature } from '@/lib/square';
import crypto from 'node:crypto';

test('validatePlanForSquareCheckout rejects plans without square variation id', () => {
  const result = validatePlanForSquareCheckout({
    id: 'p1',
    code: 'standard_monthly',
    tier: 'standard',
    billingCycle: 'monthly',
    name: 'Pro',
    description: 'desc',
    currency: 'usd',
    amount: 10,
    interval: 'monthly',
    active: true,
    squareSubscriptionPlanVariationId: null,
  });

  assert.equal(result.ok, false);
});

test('validatePlanForSquareCheckout accepts active mapped plan', () => {
  const result = validatePlanForSquareCheckout({
    id: 'p1',
    code: 'standard_monthly',
    tier: 'standard',
    billingCycle: 'monthly',
    name: 'Pro',
    description: 'desc',
    currency: 'usd',
    amount: 10,
    interval: 'monthly',
    active: true,
    squareSubscriptionPlanVariationId: 'SVAR123',
  });

  assert.equal(result.ok, true);
});

test('normalizeMembershipStatusFromSquare maps statuses', () => {
  assert.equal(normalizeMembershipStatusFromSquare('ACTIVE'), 'active');
  assert.equal(normalizeMembershipStatusFromSquare('CANCELED'), 'canceled');
  assert.equal(normalizeMembershipStatusFromSquare('PAUSED'), 'suspended');
});

test('verifySquareWebhookSignature validates expected signature', () => {
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = 'abc123';
  const body = JSON.stringify({ id: 'evt_1' });
  const notificationUrl = 'https://example.com/api/square/webhooks';
  const hmac = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SIGNATURE_KEY);
  hmac.update(notificationUrl + body);
  const signature = hmac.digest('base64');

  assert.equal(
    verifySquareWebhookSignature({ body, signature, notificationUrl }),
    true,
  );
});
