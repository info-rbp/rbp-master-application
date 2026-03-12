import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getTemplateForContentType } from '@/lib/detail-templates';
import { toRenderableDocushareSuite, toRenderableKnowledgeArticle, toRenderablePartnerOffer } from '@/lib/content-objects';

test('template selection resolves type-specific sections', () => {
  const docTemplate = getTemplateForContentType('docshare_template');
  const offerTemplate = getTemplateForContentType('partner_offer');
  const serviceTemplate = getTemplateForContentType('service_page');

  assert.equal(docTemplate.sections[0].title, 'Template Details');
  assert.equal(offerTemplate.sections[0].title, 'Offer Details');
  assert.equal(serviceTemplate.sections[0].title, 'Service Overview');
});

test('adapters safely map missing optional structured fields', () => {
  const suite = toRenderableDocushareSuite({
    id: 'suite-1',
    name: 'Ops Template',
    description: 'desc',
    contentType: 'templates',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const offer = toRenderablePartnerOffer({
    id: 'offer-1',
    title: 'Offer',
    description: 'desc',
    link: 'https://example.com',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const article = toRenderableKnowledgeArticle({
    id: 'a1',
    title: 'Article',
    slug: 'article',
    content: 'content',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(Array.isArray(suite.templateFields?.whatsIncluded ?? []), true);
  assert.equal(Array.isArray(offer.templateFields?.offerHighlights ?? []), true);
  assert.equal(Array.isArray(article.templateFields?.keyTakeaways ?? []), true);
});


test('related content block and template pages contain no Stripe assumptions', () => {
  const files = [
    'src/components/public/content-detail-shell.tsx',
    'src/lib/detail-templates.ts',
    'src/lib/content-objects.ts',
  ];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    assert.equal(text.includes('stripe'), false, `${file} should not include Stripe assumptions`);
  }
});
