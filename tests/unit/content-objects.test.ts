import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureUniqueSlug, getContentObjectPath, normalizeSlug, toRenderableDocushareSuite, toRenderablePartnerOffer } from '@/lib/content-objects';

test('normalizeSlug sanitizes and lowercases', () => {
  assert.equal(normalizeSlug('  Hello & World!  '), 'hello-and-world');
});

test('ensureUniqueSlug adds incrementing suffix', () => {
  assert.equal(ensureUniqueSlug('Template', ['template', 'template-2']), 'template-3');
});

test('getContentObjectPath resolves major families', () => {
  assert.equal(getContentObjectPath('partner_offer', 'my-offer'), '/partner-offers/my-offer');
  assert.equal(getContentObjectPath('knowledge_center_tool', 'tool-kit'), '/knowledge-center/tools/tool-kit');
  assert.equal(getContentObjectPath('docshare_template', 'ops-pack', 'templates'), '/docushare/templates/ops-pack');
});

test('docushare adapter maps to published by default', () => {
  const mapped = toRenderableDocushareSuite({
    id: 's1',
    name: 'Ops Suite',
    description: 'desc',
    contentType: 'templates',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(mapped.contentType, 'docshare_template');
  assert.equal(mapped.status, 'published');
});

test('partner offer adapter defaults CTA to redeem', () => {
  const mapped = toRenderablePartnerOffer({
    id: 'o1',
    title: 'Offer',
    description: 'desc',
    link: 'https://example.com',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(mapped.actionType, 'redeem');
  assert.equal(mapped.status, 'published');
});
