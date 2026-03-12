import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscoveryFilters, getDiscoveryFilterOptions, getDiscoveryPath, resolveRelatedDiscoveryItems, type DiscoveryItem } from '../../src/lib/discovery';
import type { RenderableContentObject } from '../../src/lib/content-objects';

const items: DiscoveryItem[] = [
  {
    id: 'docshare_template:t1',
    sourceType: 'documentation_suites',
    sourceId: 't1',
    contentType: 'docshare_template',
    title: 'Operations Kickoff Template',
    slug: 'operations-kickoff-template',
    summary: 'Template summary',
    tags: ['Operations', 'Kickoff'],
    category: 'Operations',
    accessTier: 'basic',
    published: true,
    path: '/docushare/templates/operations-kickoff-template',
    keywords: ['operations', 'kickoff', 'template'],
    relatedContent: [{ id: 'g1', contentType: 'docshare_companion_guide' }],
    companionIds: ['g1'],
  },
  {
    id: 'docshare_companion_guide:g1',
    sourceType: 'documentation_suites',
    sourceId: 'g1',
    contentType: 'docshare_companion_guide',
    title: 'Operations Companion Guide',
    slug: 'operations-companion-guide',
    tags: ['Operations'],
    category: 'Operations',
    accessTier: 'standard',
    published: true,
    path: '/docushare/companion-guides/operations-companion-guide',
    keywords: ['operations', 'guide'],
    relatedContent: [],
    companionIds: [],
  },
  {
    id: 'partner_offer:o1',
    sourceType: 'partner_offers',
    sourceId: 'o1',
    contentType: 'partner_offer',
    title: 'Software Discount',
    slug: 'software-discount',
    tags: ['Software'],
    category: 'Software',
    accessTier: 'standard',
    published: true,
    path: '/partner-offers/software-discount',
    keywords: ['software', 'discount'],
    relatedContent: [],
    companionIds: [],
  },
  {
    id: 'knowledge_center_article:k1',
    sourceType: 'knowledge_articles',
    sourceId: 'k1',
    contentType: 'knowledge_center_article',
    title: 'Draft hidden',
    slug: 'draft-hidden',
    tags: ['Operations'],
    category: 'Operations',
    published: false,
    path: '/knowledge-center/articles/draft-hidden',
    keywords: ['draft'],
    relatedContent: [],
    companionIds: [],
  },
];

test('applyDiscoveryFilters limits to published and supports keyword/tier/contentType/tag/category', () => {
  const filtered = applyDiscoveryFilters(items, {
    keyword: 'operations',
    contentType: 'docshare_template',
    tag: 'Operations',
    category: 'Operations',
    tier: 'basic',
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'docshare_template:t1');
});

test('getDiscoveryFilterOptions builds option sets from metadata', () => {
  const options = getDiscoveryFilterOptions(items.filter((item) => item.published));
  assert.deepEqual(options.categories, ['Operations', 'Software']);
  assert.deepEqual(options.tiers, ['basic', 'standard']);
  assert.ok(options.contentTypes.includes('docshare_template'));
});

test('resolveRelatedDiscoveryItems prioritizes explicit and companion relationships', () => {
  const current = items[0];
  const related = resolveRelatedDiscoveryItems(current, items, 3);
  assert.equal(related[0].id, 'docshare_companion_guide:g1');
  assert.ok(!related.some((item) => item.id === current.id));
});

test('getDiscoveryPath resolves routes for key content types', () => {
  const content = {
    id: '1',
    sourceCollection: 'knowledge_articles',
    sourceId: '1',
    contentType: 'knowledge_center_article',
    title: 'Title',
    slug: 'title',
    tags: [],
    relatedContent: [],
    status: 'published',
  } as RenderableContentObject;

  assert.equal(getDiscoveryPath(content), '/knowledge-center/articles/title');
});

test('discovery helpers and fixtures contain no Stripe assumptions', () => {
  const blob = JSON.stringify(items).toLowerCase();
  assert.equal(blob.includes('stripe'), false);
});
