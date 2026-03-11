import test from 'node:test';
import assert from 'node:assert/strict';
import { getOfferCategories } from '../../src/app/partner-offers/data';

test('getOfferCategories respects explicit categories from CMS', () => {
  const categories = getOfferCategories(7, 10, ['top', 'exclusive']);
  assert.ok(categories.includes('all'));
  assert.ok(categories.includes('top'));
  assert.ok(categories.includes('exclusive'));
  assert.equal(categories.includes('our'), false);
});
