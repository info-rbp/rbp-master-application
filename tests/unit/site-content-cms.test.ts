import test from 'node:test';
import assert from 'node:assert/strict';
import { getOfferCategories, toOfferView } from '../../src/app/partner-offers/data';

test('getOfferCategories includes all and deterministic categories', () => {
  const first = getOfferCategories(0, 10);
  const later = getOfferCategories(7, 10);

  assert.ok(first.includes('all'));
  assert.ok(first.includes('top'));
  assert.ok(first.includes('new'));
  assert.ok(later.includes('all'));
  assert.equal(new Set(first).size, first.length);
});

test('toOfferView maps partner offer into public card shape', () => {
  const mapped = toOfferView(
    {
      id: 'offer-1',
      title: 'Founder Stack',
      description: 'Tooling discount',
      link: '/partner/offer',
      active: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    0,
    5,
  );

  assert.equal(mapped.partner, 'Founder Stack');
  assert.equal(mapped.href, '/partner-offers/offer-1');
  assert.ok(mapped.categories.includes('all'));
});
