import type { KnowledgeArticle } from './definitions';

export const KNOWLEDGE_CONTENT_TYPES = ['article', 'guide', 'tool', 'knowledge_base'] as const;

export type KnowledgeContentType = (typeof KNOWLEDGE_CONTENT_TYPES)[number];

export function isKnowledgeContentType(value: string): value is KnowledgeContentType {
  return KNOWLEDGE_CONTENT_TYPES.includes(value as KnowledgeContentType);
}

export function normalizeKnowledgeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseTagInput(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

export function canPublishKnowledgeArticle(article: Pick<KnowledgeArticle, 'title' | 'slug' | 'content'>): boolean {
  return Boolean(article.title?.trim() && article.slug?.trim() && article.content?.trim());
}
