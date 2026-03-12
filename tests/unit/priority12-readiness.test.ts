import test from 'node:test';
import assert from 'node:assert/strict';

import { ANALYTICS_EVENTS, buildAnalyticsEventRecord } from '@/lib/analytics-events';
import { buildSeoMetadata } from '@/lib/seo';
import robots from '@/app/robots';
import { validateRequiredEnv } from '@/lib/launch-readiness';

test('analytics event record sanitizes metadata and supports priority 12 events', () => {
  const record = buildAnalyticsEventRecord({ eventType: ANALYTICS_EVENTS.LOCKED_CTA_CLICKED, metadata: { a: 1, invalid: undefined } });
  assert.equal(record.eventType, ANALYTICS_EVENTS.LOCKED_CTA_CLICKED);
  assert.equal(typeof record.createdAt, 'object');
  assert.deepEqual(record.metadata, { a: 1 });
  assert.ok(ANALYTICS_EVENTS.SERVICE_PAGE_VIEWED);
  assert.ok(ANALYTICS_EVENTS.PUBLIC_OFFER_VIEWED);
  assert.ok(ANALYTICS_EVENTS.UPGRADE_REQUIRED_PROMPT_SHOWN);
});

test('seo helper sets canonical and robots defaults', () => {
  const metadata = buildSeoMetadata({ title: 'Test', description: 'Description', path: '/test' });
  assert.equal(metadata.alternates?.canonical?.toString().endsWith('/test'), true);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
});

test('robots disallows private routes and provides sitemap', () => {
  const config = robots();
  assert.equal(Array.isArray(config.rules), false);
  const rule = config.rules as { disallow?: string[] };
  assert.ok(rule.disallow?.includes('/admin'));
  assert.ok(String(config.sitemap).includes('/sitemap.xml'));
});

test('launch readiness env checks identify missing variables', () => {
  const checks = validateRequiredEnv({ NEXT_PUBLIC_APP_URL: 'https://example.com' } as unknown as NodeJS.ProcessEnv);
  const firebase = checks.find((check) => check.key === 'env:firebase');
  assert.equal(firebase?.status, 'warning');
  assert.ok(firebase?.detail.includes('FIREBASE_PROJECT_ID'));
});

test('codebase does not introduce Stripe assumptions in source', async () => {
  const fs = await import('node:fs/promises');
  const files = ['src/lib/analytics.ts', 'src/lib/launch-readiness.ts', 'src/app/api/analytics/public/route.ts'];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    assert.equal(content.toLowerCase().includes('stripe'), false, `${file} unexpectedly references stripe`);
  }
});
