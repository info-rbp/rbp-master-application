import test from 'node:test';
import assert from 'node:assert/strict';
import { filterActivePartnerOffers, filterPublishedDocushareSuites, filterPublishedKnowledgeItems } from '../../src/lib/public-catalogue';
import { getOfferCategories, toOfferView } from '../../src/app/partner-offers/data';
import fs from 'node:fs';

test('DocuShare listing helper only keeps published suites', () => {
  const suites: Array<{ id: string; status: 'published' | 'draft' }> = [
    { id: '1', status: 'published' },
    { id: '2', status: 'draft' },
  ];
  const result = filterPublishedDocushareSuites(suites);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('Partner marketplace helper only keeps active offers', () => {
  const offers = [{ id: '1', active: true }, { id: '2', active: false }];
  const result = filterActivePartnerOffers(offers);
  assert.deepEqual(result.map((offer) => offer.id), ['1']);
});

test('Knowledge helper only keeps published content', () => {
  const entries = [{ id: '1', published: true }, { id: '2', published: false }];
  const result = filterPublishedKnowledgeItems(entries);
  assert.deepEqual(result.map((entry) => entry.id), ['1']);
});

test('Offer view mapping includes tier/metadata support and category derivation', () => {
  const mapped = toOfferView(
    {
      id: 'x',
      title: 'Offer',
      description: 'Description',
      link: '/x',
      active: true,
      categories: ['exclusive'],
      entitlement: { accessTier: 'standard', requiresLogin: true, requiresMembership: true, previewEnabled: true, isLimitedAccess: true, contentType: 'partner_offer_exclusive' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    0,
    10,
  );

  assert.equal(mapped.accessTier, 'standard');
  assert.ok(mapped.categories.includes('exclusive'));
  assert.ok(mapped.categories.includes('all'));
  assert.deepEqual(getOfferCategories(0, 1, ['top']), ['top', 'all']);
});

test('Public catalogue conversion did not introduce Stripe assumptions', () => {
  const files = [
    'src/app/partner-offers/data.ts',
    'src/app/services/page.tsx',
    'src/app/membership/page.tsx',
  ];
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    assert.equal(content.includes('stripe'), false, `${file} should not reference Stripe`);
  });
});
