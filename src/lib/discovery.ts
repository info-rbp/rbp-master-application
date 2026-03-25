import {
  getDocumentSuites,
  getPublishedDocuments,
  getPublishedKnowledgeArticles,
  getPublishedPartnerOffers,
  getPublishedServicePages,
  getPublishedSuites,
} from './data';
import {
  getContentObjectPath,
  toRenderableDocushareSuite,
  toRenderableDocument,
  toRenderableKnowledgeArticle,
  toRenderablePartnerOffer,
  toRenderableServicePage,
  type RenderableContentObject,
} from './content-objects';
import { resolveRelatedContentCards } from './content-routing';

export type DiscoveryItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  contentType: string;
  category?: string;
  tags: string[];
  path: string;
  published: boolean;
  featured?: boolean;
  updatedAt?: string;
  accessTier?: string;
};

export type DiscoverySearchFilters = {
  query?: string;
  type?: string;
};

function toDiscoveryItem(content: RenderableContentObject): DiscoveryItem {
  return {
    id: content.id,
    title: content.title,
    description: content.summary ?? content.description ?? '',
    type: content.contentType,
    contentType: content.contentType,
    category: content.category,
    tags: content.tags,
    path: content.actionTarget?.startsWith('/')
      ? content.actionTarget
      : getContentObjectPath(content.contentType, content.slug, content.category),
    published: content.status === 'published',
    featured: content.featured,
    updatedAt: content.updatedAt ?? content.publishedAt ?? content.createdAt,
    accessTier: content.accessBehavior?.accessTier,
  };
}

export async function getPublicDiscoveryItems(): Promise<DiscoveryItem[]> {
  const [suites, allSuites, documents, knowledgeArticles, partnerOffers, servicePages] = await Promise.all([
    getPublishedSuites(),
    getDocumentSuites(),
    getPublishedDocuments(),
    getPublishedKnowledgeArticles(),
    getPublishedPartnerOffers(),
    getPublishedServicePages(),
  ]);

  const suiteById = new Map(allSuites.map((suite) => [suite.id, suite]));

  return [
    ...suites.map((suite) => toDiscoveryItem(toRenderableDocushareSuite(suiteById.get(suite.id) ?? { ...suite, documents: [] }))),
    ...documents.map((document) => toDiscoveryItem(toRenderableDocument(document))),
    ...knowledgeArticles.map((article) => toDiscoveryItem(toRenderableKnowledgeArticle(article))),
    ...partnerOffers.map((offer) => toDiscoveryItem(toRenderablePartnerOffer(offer))),
    ...servicePages.map((service) => toDiscoveryItem(toRenderableServicePage(service))),
  ];
}

export async function searchCatalogue(filters: DiscoverySearchFilters): Promise<DiscoveryItem[]> {
  const items = await getPublicDiscoveryItems();
  return items.filter((item) => {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const matches = item.title.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query)
        || item.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matches) return false;
    }

    if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }

    return true;
  });
}

export async function getRelatedResourcesForContent(content: RenderableContentObject, limit = 6) {
  const relatedCards = await resolveRelatedContentCards(content);
  const discoveryItems = await getPublicDiscoveryItems();
  const discoveryById = new Map(discoveryItems.map((item) => [item.id, item]));

  const explicitRelated = relatedCards.map((item) => {
    const match = discoveryById.get(item.id);
    return {
      id: item.id,
      title: item.title,
      path: item.path ?? match?.path ?? '#',
      contentType: item.contentType,
      category: match?.category,
      accessTier: match?.accessTier,
    };
  }).filter((item) => item.path !== '#');

  if (explicitRelated.length > 0) {
    return explicitRelated.slice(0, limit);
  }

  return discoveryItems
    .filter((item) => item.id !== content.id)
    .filter((item) => !content.category || item.category === content.category || item.contentType === content.contentType)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
      contentType: item.contentType,
      category: item.category,
      accessTier: item.accessTier,
    }));
}
