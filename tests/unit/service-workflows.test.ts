import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { canAccessImplementationSupport, canBookDiscoveryCall, canBookStrategicCheckup, canSubmitCustomisationRequest, getCustomisationRequestAllowance } from '@/lib/entitlements';

test('customisation eligibility and monthly limits follow membership tiers', () => {
  assert.equal(getCustomisationRequestAllowance('basic'), 0);
  assert.equal(canSubmitCustomisationRequest('basic', 0), false);

  assert.equal(getCustomisationRequestAllowance('standard'), 1);
  assert.equal(canSubmitCustomisationRequest('standard', 0), true);
  assert.equal(canSubmitCustomisationRequest('standard', 1), false);

  assert.equal(getCustomisationRequestAllowance('premium'), 'unlimited');
  assert.equal(canSubmitCustomisationRequest('premium', 999), true);
});

test('implementation support and strategic checkups remain premium-only', () => {
  assert.equal(canAccessImplementationSupport('basic'), false);
  assert.equal(canAccessImplementationSupport('standard'), false);
  assert.equal(canAccessImplementationSupport('premium'), true);

  assert.equal(canBookStrategicCheckup('standard'), false);
  assert.equal(canBookStrategicCheckup('premium'), true);
});

test('discovery calls remain available across all membership tiers', () => {
  assert.equal(canBookDiscoveryCall('basic'), true);
  assert.equal(canBookDiscoveryCall('standard'), true);
  assert.equal(canBookDiscoveryCall('premium'), true);
});

test('member api routes use server-side auth context and do not trust client memberId', () => {
  const files = [
    'src/app/api/member/customisation-requests/route.ts',
    'src/app/api/member/support-requests/route.ts',
    'src/app/api/member/discovery-calls/route.ts',
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.match(content, /getServerAuthContext/);
    assert.match(content, /auth\.userId/);
    assert.equal(/memberId\s*:\s*body\./.test(content), false, `${file} should not trust client memberId`);
  }
});

test('priority 10 workflow code introduces no stripe assumptions', () => {
  const files = [
    'src/lib/service-workflows.ts',
    'src/app/admin/services/request-queue.tsx',
    'src/app/portal/customisation-requests/page.tsx',
    'src/app/portal/support/page.tsx',
    'src/app/portal/discovery-calls/page.tsx',
    'firestore.rules',
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    assert.equal(content.includes('stripe'), false, `${file} should not contain Stripe assumptions`);
  }
});
