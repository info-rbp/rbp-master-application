import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlanCodeToBillingCycle, resolvePlanCodeToTier, getEffectiveMembershipTier } from '@/lib/entitlements';
import { calculatePromotionWindow, resolvePromotionalEffectiveTier } from '@/lib/promotions';
import { normalizeSquareLifecycleType, resolveLifecycleStatusFromSquare } from '@/lib/membership-lifecycle';
import { readFileSync } from 'node:fs';

test('plan code resolution supports monthly and annual variants', () => {
  assert.equal(resolvePlanCodeToTier('standard_monthly'), 'standard');
  assert.equal(resolvePlanCodeToTier('standard_annual'), 'standard');
  assert.equal(resolvePlanCodeToTier('premium_monthly'), 'premium');
  assert.equal(resolvePlanCodeToTier('premium_annual'), 'premium');

  assert.equal(resolvePlanCodeToBillingCycle('basic_free'), 'free');
  assert.equal(resolvePlanCodeToBillingCycle('standard_monthly'), 'monthly');
  assert.equal(resolvePlanCodeToBillingCycle('standard_annual'), 'annual');
  assert.equal(resolvePlanCodeToBillingCycle('premium_monthly'), 'monthly');
  assert.equal(resolvePlanCodeToBillingCycle('premium_annual'), 'annual');
});

test('promotion utilities enforce 3-month standard grant window and highest-tier access', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const window = calculatePromotionWindow(start, 3, 0);
  assert.equal(window.grantStartAt, '2026-01-01T00:00:00.000Z');
  assert.equal(window.grantEndAt, '2026-04-01T00:00:00.000Z');

  assert.equal(resolvePromotionalEffectiveTier('basic', 'standard'), 'standard');
  assert.equal(resolvePromotionalEffectiveTier('premium', 'standard'), 'premium');

  const now = new Date('2026-02-01T00:00:00.000Z');
  assert.equal(getEffectiveMembershipTier({
    membershipTier: 'basic',
    membershipStatus: 'active',
    grants: [{
      id: 'g1', userId: 'u1', sourceType: 'service_purchase', sourceReferenceId: 'svc1', grantTier: 'standard',
      grantStartAt: '2026-01-01T00:00:00.000Z', grantEndAt: '2026-04-01T00:00:00.000Z', status: 'active', createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }],
    now,
  }), 'standard');
});

test('lifecycle mapping covers payment failures, cancellations, and reactivation', () => {
  assert.equal(resolveLifecycleStatusFromSquare('PAST_DUE'), 'past_due');
  assert.equal(resolveLifecycleStatusFromSquare('UNPAID'), 'unpaid');
  assert.equal(resolveLifecycleStatusFromSquare('ACTIVE'), 'active');

  assert.equal(normalizeSquareLifecycleType('invoice.payment_made', 'active', 'paid'), 'payment_succeeded');
  assert.equal(normalizeSquareLifecycleType('invoice.payment_failed', 'past_due', 'failed'), 'payment_failed');
  assert.equal(normalizeSquareLifecycleType('subscription.canceled', 'canceled'), 'subscription_canceled');
  assert.equal(normalizeSquareLifecycleType('subscription.updated', 'active'), 'subscription_updated');
});

test('billing stack keeps Square-only assumptions', () => {
  const billing = readFileSync('src/lib/billing.ts', 'utf8').toLowerCase();
  const square = readFileSync('src/lib/square.ts', 'utf8').toLowerCase();
  assert.equal(billing.includes('stripe'), false);
  assert.equal(square.includes('stripe'), false);
});
