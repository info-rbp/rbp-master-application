import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { canAccessImplementationSupport, canSubmitCustomisationRequest, getEffectiveMembershipTier } from '@/lib/entitlements';
import { canRequestCallType, canSubmitImplementationSupport, getCustomisationAllowanceSummary, shapeSubscriptionSummary } from '@/lib/member-dashboard-utils';

test('member route protection helper redirects unauthenticated users to login', () => {
  const file = fs.readFileSync(path.join(process.cwd(), 'src/app/portal/_lib/member-auth.ts'), 'utf8');
  assert.match(file, /redirect\('\/login'\)/);
});

test('membership summary and entitlement shaping are consistent', () => {
  const tier = getEffectiveMembershipTier({ planCode: 'standard_monthly', membershipStatus: 'active' });
  assert.equal(tier, 'standard');
  const allowance = getCustomisationAllowanceSummary(tier, 0);
  assert.equal(allowance.canSubmit, true);
  assert.equal(allowance.remaining, 1);
});

test('billing/subscription section data shaping computes renewal and issue status', () => {
  const summary = shapeSubscriptionSummary({
    planCode: 'premium_monthly',
    tier: 'premium',
    billingCycle: 'monthly',
    renewalDate: '2026-12-01',
    endDate: null,
    lastPaymentStatus: 'paid',
  });
  assert.equal(summary.renewalOrEndDate, '2026-12-01');
  assert.equal(summary.hasPaymentIssue, false);
});

test('customisation entitlement enforcement aligns with tiers', () => {
  assert.equal(canSubmitCustomisationRequest('basic', 0), false);
  assert.equal(canSubmitCustomisationRequest('standard', 0), true);
  assert.equal(canSubmitCustomisationRequest('standard', 1), false);
});

test('implementation support enforcement remains premium only', () => {
  assert.equal(canAccessImplementationSupport('premium'), true);
  assert.equal(canSubmitImplementationSupport('standard'), false);
});

test('saved/favourite model route and collection names are present', () => {
  const file = fs.readFileSync(path.join(process.cwd(), 'src/lib/member-dashboard.ts'), 'utf8');
  assert.match(file, /user_saved_items/);
  assert.match(file, /saveItem/);
});

test('recent activity model is typed and persisted', () => {
  const file = fs.readFileSync(path.join(process.cwd(), 'src/lib/member-dashboard.ts'), 'utf8');
  assert.match(file, /RecentActivityRecord/);
  assert.match(file, /user_recent_activity/);
});

test('call entitlement check blocks non-premium strategic checkups', () => {
  assert.equal(canRequestCallType('standard', 'strategic_checkup'), false);
  assert.equal(canRequestCallType('premium', 'strategic_checkup'), true);
});

test('new member dashboard code does not introduce stripe assumptions', () => {
  const targets = [
    'src/app/portal',
    'src/app/api/member',
    'src/lib/member-dashboard.ts',
  ];

  for (const target of targets) {
    const fullPath = path.join(process.cwd(), target);
    const content = fs.statSync(fullPath).isDirectory()
      ? fs.readdirSync(fullPath, { recursive: true }).filter((entry) => String(entry).endsWith('.ts') || String(entry).endsWith('.tsx')).map((entry) => fs.readFileSync(path.join(fullPath, String(entry)), 'utf8')).join('\n')
      : fs.readFileSync(fullPath, 'utf8');

    assert.equal(/stripe/i.test(content), false, `Found Stripe term in ${target}`);
  }
});
