import test from 'node:test';
import assert from 'node:assert/strict';
import { canPublishKnowledgeArticle, normalizeKnowledgeSlug, parseTagInput } from '@/lib/knowledge-center';

test('normalizeKnowledgeSlug creates URL-safe slug', () => {
  assert.equal(normalizeKnowledgeSlug('  My First Guide!  '), 'my-first-guide');
  assert.equal(normalizeKnowledgeSlug('A---B'), 'a-b');
});

test('parseTagInput deduplicates and trims tags', () => {
  assert.deepEqual(parseTagInput('finance, operations, finance ,  legal'), ['finance', 'operations', 'legal']);
});

test('canPublishKnowledgeArticle requires title, slug and content', () => {
  assert.equal(canPublishKnowledgeArticle({ title: 'T', slug: 's', content: 'body' }), true);
  assert.equal(canPublishKnowledgeArticle({ title: 'T', slug: '', content: 'body' }), false);
  assert.equal(canPublishKnowledgeArticle({ title: '', slug: 'slug', content: 'body' }), false);
});
