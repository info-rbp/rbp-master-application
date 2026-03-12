import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthRedirectPath, resolvePostAuthPath, sanitizeReturnPath } from '@/lib/return-path';
import { getDefaultActionLabel, mapActionTypeFromContentAction } from '@/lib/protected-actions';
import { readFile } from 'node:fs/promises';

test('return path helpers prevent open redirect values', () => {
  assert.equal(sanitizeReturnPath('/docushare/templates/example'), '/docushare/templates/example');
  assert.equal(sanitizeReturnPath('https://evil.test'), '/account');
  assert.equal(sanitizeReturnPath('//evil.test/path'), '/account');
  assert.equal(resolvePostAuthPath(undefined), '/account');

  const loginPath = buildAuthRedirectPath('/login', 'https://evil.test');
  assert.equal(loginPath, '/login?returnTo=%2Faccount');
});

test('protected action label mapping stays deterministic', () => {
  assert.equal(mapActionTypeFromContentAction('redeem', 'partner_offer'), 'redeem_offer');
  assert.equal(mapActionTypeFromContentAction('launch', 'docshare_tool'), 'launch_tool');
  assert.equal(mapActionTypeFromContentAction(undefined, 'docshare_documentation_suite'), 'access_suite');
  assert.equal(mapActionTypeFromContentAction(undefined, 'docshare_template'), 'download_resource');

  assert.equal(getDefaultActionLabel('submit_support_request'), 'Submit support request');
});

test('square platform remains the billing integration in repository metadata', async () => {
  const packageJsonRaw = await readFile(new URL('../../package.json', import.meta.url), 'utf8');
  const packageJson = JSON.parse(packageJsonRaw) as { dependencies?: Record<string, string> };
  const deps = Object.keys(packageJson.dependencies ?? {});
  assert.equal(deps.some((name) => name.toLowerCase().includes('stripe')), false);
});
