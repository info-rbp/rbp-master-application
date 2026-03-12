import { getContentObjectPath, getDocushareSegment, toRenderableDocushareSuite, toRenderableKnowledgeArticle, toRenderablePartnerOffer, toRenderableServicePage, type ContentObjectType, type RenderableContentObject } from './content-objects';
import type { MembershipTier } from './definitions';
import { getActivePartnerOffers, getDocumentSuites, getKnowledgeArticles, getPublishedServicePages } from './data';

export type DiscoveryItem = {
  id: string;
  sourceType: RenderableContentObject['sourceCollection'];
  sourceId: string;
  contentType: ContentObjectType;
  subtype?: string;
  title: string;
  slug: string;
  summary?: string;
  tags: string[];
  category?: string;
  accessTier?: MembershipTier;
  published: boolean;
  thumbnailUrl?: string;
  featured?: boolean;
  path: string;
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
  relatedContent: RenderableContentObject['relatedContent'];
  companionIds: string[];
};

export type DiscoveryFilters = {
  keyword?: string;
  category?: string;
  tag?: string;
  contentType?: string;
  tier?: MembershipTier | 'all';
};

export function getDiscoveryPath(item: RenderableContentObject): string {
  if (item.contentType.startsWith('docshare_') && item.contentType !== 'docshare_resource') {
    const map: Record<ContentObjectType, string | undefined> = {
      docshare_template: 'templates',
      docshare_companion_guide: 'companion-guides',
      docshare_documentation_suite: 'documentation-suites',
      docshare_end_to_end_process: 'end-to-end-processes',
      docshare_tool: 'tools',
      docshare_resource: 'resources',
      partner_offer: undefined,
      knowledge_center_article: undefined,
      knowledge_center_guide: undefined,
      knowledge_center_tool: undefined,
      knowledge_center_knowledge_base: undefined,
      service_page: undefined,
    };
    return getContentObjectPath(item.contentType, item.slug, map[item.contentType] ?? getDocushareSegment('templates'));
  }
  return getContentObjectPath(item.contentType, item.slug);
}

function normalizeKeywords(item: RenderableContentObject) {
  const keywords = [
    item.title,
    item.summary,
    item.description,
    item.category,
    ...item.tags,
    item.contentType.replaceAll('_', ' '),
    item.templateFields?.relatedResourcesSummary,
    item.templateFields?.relatedTemplatesSummary,
  ]
    .filter((x): x is string => Boolean(x))
    .flatMap((value) => value.split(/[\s,/|]+/g))
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(keywords)];
}

function toDiscoveryItem(item: RenderableContentObject): DiscoveryItem {
  const companionIds = Array.from(
    new Set([
      ...(item.relatedContent ?? []).map((entry) => entry.id),
      ...((item.templateFields?.relatedTemplates as string[] | undefined) ?? []),
      ...((item.templateFields?.relatedResources as string[] | undefined) ?? []),
    ]),
  );

  return {
    id: `${item.contentType}:${item.id}`,
    sourceType: item.sourceCollection,
    sourceId: item.sourceId,
    contentType: item.contentType,
    subtype: item.category,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    tags: item.tags,
    category: item.category,
    accessTier: item.accessBehavior?.accessTier,
    published: item.status === 'published',
    thumbnailUrl: item.heroImageUrl,
    featured: item.featured,
    path: getDiscoveryPath(item),
    keywords: normalizeKeywords(item),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    relatedContent: item.relatedContent,
    companionIds,
  };
}

export async function getPublicDiscoveryItems(): Promise<DiscoveryItem[]> {
  const [suites, offers, knowledge, services] = await Promise.all([
    getDocumentSuites(),
    getActivePartnerOffers(),
    getKnowledgeArticles({ published: true }),
    getPublishedServicePages(),
  ]);

  const rows = [
    ...suites.filter((suite) => suite.status === 'published').map((suite) => toDiscoveryItem(toRenderableDocushareSuite(suite))),
    ...offers.filter((offer) => offer.active).map((offer) => toDiscoveryItem(toRenderablePartnerOffer(offer))),
    ...knowledge.filter((article) => article.published).map((article) => toDiscoveryItem(toRenderableKnowledgeArticle(article))),
    ...services.filter((service) => service.published).map((service) => toDiscoveryItem(toRenderableServicePage(service))),
  ];

  return rows.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

export function applyDiscoveryFilters(items: DiscoveryItem[], filters: DiscoveryFilters): DiscoveryItem[] {
  const keyword = filters.keyword?.trim().toLowerCase();
  return items.filter((item) => {
    if (!item.published) return false;
    if (filters.contentType && filters.contentType !== 'all' && item.contentType !== filters.contentType) return false;
    if (filters.category && filters.category !== 'all' && (item.category ?? '').toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.tag && filters.tag !== 'all' && !item.tags.some((tag) => tag.toLowerCase() === filters.tag?.toLowerCase())) return false;
    if (filters.tier && filters.tier !== 'all' && item.accessTier !== filters.tier) return false;
    if (keyword) {
      const haystack = `${item.title} ${item.summary ?? ''} ${item.category ?? ''} ${item.tags.join(' ')} ${item.keywords.join(' ')}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export function getDiscoveryFilterOptions(items: DiscoveryItem[]) {
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort();
  const tags = Array.from(new Set(items.flatMap((item) => item.tags).filter(Boolean))).sort();
  const contentTypes = Array.from(new Set(items.map((item) => item.contentType))).sort();
  const tiers = Array.from(new Set(items.map((item) => item.accessTier).filter(Boolean) as MembershipTier[])).sort();

  return { categories, tags, contentTypes, tiers };
}

export function resolveRelatedDiscoveryItems(current: DiscoveryItem, items: DiscoveryItem[], limit = 6): DiscoveryItem[] {
  const candidates = items.filter((item) => item.id !== current.id && item.published);

  const explicitIds = new Set(current.relatedContent.map((item) => `${item.contentType}:${item.id}`));
  const companionIds = new Set(current.companionIds);

  const scored = candidates
    .map((candidate) => {
      let score = 0;
      if (explicitIds.has(candidate.id) || explicitIds.has(`${candidate.contentType}:${candidate.sourceId}`)) score += 100;
      if (companionIds.has(candidate.sourceId) || companionIds.has(candidate.id)) score += 60;
      if (current.category && candidate.category && current.category.toLowerCase() === candidate.category.toLowerCase()) score += 20;
      const sharedTags = candidate.tags.filter((tag) => current.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())).length;
      score += sharedTags * 10;
      if (current.contentType === candidate.contentType) score += 5;
      const docToGuideJourney = current.contentType === 'docshare_template' && candidate.contentType === 'docshare_companion_guide';
      const guideToTemplateJourney = current.contentType === 'docshare_companion_guide' && (candidate.contentType === 'docshare_template' || candidate.contentType === 'docshare_tool');
      const serviceToKnowledgeJourney = current.contentType === 'service_page' && candidate.contentType.startsWith('knowledge_center');
      if (docToGuideJourney || guideToTemplateJourney || serviceToKnowledgeJourney) score += 25;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);

  return scored;
}


export async function getRelatedResourcesForContent(content: RenderableContentObject, limit = 6): Promise<DiscoveryItem[]> {
  const items = await getPublicDiscoveryItems();
  const current = items.find((item) => item.sourceId === content.sourceId && item.contentType === content.contentType)
    ?? items.find((item) => item.slug === content.slug && item.contentType === content.contentType);
  if (!current) return [];
  return resolveRelatedDiscoveryItems(current, items, limit);
}
