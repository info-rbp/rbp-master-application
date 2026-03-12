import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessContent,
  canAccessImplementationSupport,
  canBookStrategicCheckup,
  canSubmitCustomisationRequest,
  CONTENT_ACCESS_DEFAULTS,
  getCustomisationRequestAllowance,
  getEffectiveMembershipTier,
  getServiceDiscountPercent,
  resolvePlanCodeToBillingCycle,
  resolvePlanCodeToTier,
} from '@/lib/entitlements';

test('effective tier resolution supports base plans and active grants', () => {
  assert.equal(getEffectiveMembershipTier({ membershipTier: 'basic', membershipStatus: 'active' }), 'basic');
  assert.equal(getEffectiveMembershipTier({ planCode: 'standard_monthly', membershipStatus: 'active' }), 'standard');
  assert.equal(getEffectiveMembershipTier({ planCode: 'standard_annual', membershipStatus: 'active' }), 'standard');
  assert.equal(getEffectiveMembershipTier({ planCode: 'premium_monthly', membershipStatus: 'active' }), 'premium');
  assert.equal(getEffectiveMembershipTier({ planCode: 'premium_annual', membershipStatus: 'active' }), 'premium');

  const now = new Date('2026-01-15T00:00:00.000Z');
  assert.equal(
    getEffectiveMembershipTier({
      membershipTier: 'basic',
      membershipStatus: 'active',
      grants: [{
        id: 'g1',
        userId: 'u1',
        sourceType: 'service_purchase',
        sourceReferenceId: 'svc_1',
        grantTier: 'standard',
        grantStartAt: '2026-01-01T00:00:00.000Z',
        grantEndAt: '2026-03-31T23:59:59.000Z',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      now,
    }),
    'standard',
  );

  assert.equal(
    getEffectiveMembershipTier({
      membershipTier: 'premium',
      membershipStatus: 'active',
      grants: [{
        id: 'g1',
        userId: 'u1',
        sourceType: 'service_purchase',
        sourceReferenceId: 'svc_1',
        grantTier: 'standard',
        grantStartAt: '2026-01-01T00:00:00.000Z',
        grantEndAt: '2026-03-31T23:59:59.000Z',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      now,
    }),
    'premium',
  );

  assert.equal(
    getEffectiveMembershipTier({
      membershipTier: 'basic',
      membershipStatus: 'active',
      grants: [{
        id: 'g1',
        userId: 'u1',
        sourceType: 'service_purchase',
        sourceReferenceId: 'svc_1',
        grantTier: 'standard',
        grantStartAt: '2025-01-01T00:00:00.000Z',
        grantEndAt: '2025-03-31T23:59:59.000Z',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      now,
    }),
    'basic',
  );
});

test('feature matrix values match product requirements', () => {
  assert.equal(getServiceDiscountPercent('basic'), 5);
  assert.equal(getServiceDiscountPercent('standard'), 12.5);
  assert.equal(getServiceDiscountPercent('premium'), 20);

  assert.equal(getCustomisationRequestAllowance('basic'), 0);
  assert.equal(getCustomisationRequestAllowance('standard'), 1);
  assert.equal(getCustomisationRequestAllowance('premium'), 'unlimited');

  assert.equal(canSubmitCustomisationRequest('basic', 0), false);
  assert.equal(canSubmitCustomisationRequest('standard', 0), true);
  assert.equal(canSubmitCustomisationRequest('standard', 1), false);
  assert.equal(canSubmitCustomisationRequest('premium', 99), true);

  assert.equal(canBookStrategicCheckup('basic'), false);
  assert.equal(canBookStrategicCheckup('premium'), true);
  assert.equal(canAccessImplementationSupport('standard'), false);
  assert.equal(canAccessImplementationSupport('premium'), true);
});

test('content access evaluation handles tiered and limited access cases', () => {
  const template = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.docshare_template, isAuthenticated: true, currentTier: 'basic' });
  assert.equal(template.canUse, true);

  const standardSuite = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.docshare_documentation_suite, isAuthenticated: true, currentTier: 'basic' });
  assert.equal(standardSuite.canUse, false);
  assert.equal(standardSuite.requiredTier, 'standard');

  const premiumProcess = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.docshare_end_to_end_process, isAuthenticated: true, currentTier: 'standard' });
  assert.equal(premiumProcess.canUse, false);

  const topOffer = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.partner_offer_top, isAuthenticated: true, currentTier: 'basic' });
  assert.equal(topOffer.canUse, true);

  const exclusiveOffer = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.partner_offer_exclusive, isAuthenticated: true, currentTier: 'basic' });
  assert.equal(exclusiveOffer.canUse, false);

  const toolLimited = canAccessContent({ content: CONTENT_ACCESS_DEFAULTS.docshare_tool, isAuthenticated: true, currentTier: 'basic' });
  assert.equal(toolLimited.accessLevel, 'limited');
  assert.equal(toolLimited.isLimitedAccess, true);
});

test('plan code alignment resolves tier and billing cycle', () => {
  assert.equal(resolvePlanCodeToTier('basic_free'), 'basic');
  assert.equal(resolvePlanCodeToTier('standard_monthly'), 'standard');
  assert.equal(resolvePlanCodeToTier('premium_annual'), 'premium');

  assert.equal(resolvePlanCodeToBillingCycle('basic_free'), 'free');
  assert.equal(resolvePlanCodeToBillingCycle('standard_annual'), 'annual');
  assert.equal(resolvePlanCodeToBillingCycle('premium_monthly'), 'monthly');
});
