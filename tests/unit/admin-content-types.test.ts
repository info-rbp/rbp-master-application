import test from 'node:test';
import assert from 'node:assert/strict';
import { toOfferView } from '../../src/app/partner-offers/data';

test('toOfferView maps partner offer to public shape', () => {
  const mapped = toOfferView({
    id: '1',
    title: 'Offer',
    description: 'Desc',
    link: '/x',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(mapped.href, '/x');
  assert.equal(mapped.partner, 'Offer');
  assert.ok(mapped.categories.includes('all'));
});
