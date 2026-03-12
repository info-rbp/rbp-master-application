import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ADMIN_NAV_SECTIONS } from '@/app/admin/components/admin-navigation';

test('admin IA exposes required top-level platform operations domains', () => {
  const titles = ADMIN_NAV_SECTIONS.map((section) => section.title);
  assert.deepEqual(titles, ['Membership', 'Content', 'Services', 'Promotions', 'System']);
});

test('membership section includes plans, billing, and access permissions controls', () => {
  const membership = ADMIN_NAV_SECTIONS.find((section) => section.title === 'Membership');
  assert.ok(membership);
  const labels = membership.items.map((item) => item.title);
  assert.equal(labels.includes('Membership Plans'), true);
  assert.equal(labels.includes('Billing'), true);
  assert.equal(labels.includes('Access Permissions'), true);
});

test('admin restructuring files include no Stripe assumptions', () => {
  const files = [
    'src/app/admin/components/admin-navigation.ts',
    'src/app/admin/promotions/page.tsx',
    'src/app/admin/services/page.tsx',
    'src/lib/admin-operations.ts',
  ];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    assert.equal(text.includes('stripe'), false, `${file} should not contain Stripe assumptions`);
  }
});
