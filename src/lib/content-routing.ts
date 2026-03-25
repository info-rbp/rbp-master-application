import { getDocumentBySlug, getKnowledgeArticleBySlug, getPartnerOfferBySlug, getPublishedServicePages, getServicePageBySlug, getSuiteBySlug } from './data';
import { toRenderableDocument, toRenderableDocushareSuite, toRenderableKnowledgeArticle, toRenderablePartnerOffer, toRenderableServicePage, type RenderableContentObject } from './content-objects';
import { getUserAccessGrant, hasSufficientTier } from './entitlements/access-control';

export async function resolveDocushareSuiteBySlug(slug: string): Promise<RenderableContentObject | null> {
  const suite = await getSuiteBySlug(slug);
  if (!suite || suite.status !== 'published') return null;
  return toRenderableDocushareSuite(suite);
}

export async function resolveDocushareDocumentBySlug(slug: string): Promise<RenderableContentObject | null> {
  const document = await getDocumentBySlug(slug);
  if (!document || document.status !== 'published') return null;
  return toRenderableDocument(document);
}

export async function resolvePartnerOfferBySlug(slug: string): Promise<RenderableContentObject | null> {
  const offer = await getPartnerOfferBySlug(slug);
  if (!offer || !offer.active) return null;
  return toRenderablePartnerOffer(offer);
}

export async function resolveKnowledgeBySlug(slug: string, expectedType: 'article' | 'guide' | 'tool' | 'knowledge_base'): Promise<RenderableContentObject | null> {
  const article = await getKnowledgeArticleBySlug(slug);
  if (!article || !article.published) return null;
  if ((article.contentType ?? 'article') !== expectedType) return null;
  return toRenderableKnowledgeArticle(article);
}

export async function resolveKnowledgeBySlugWithAccessControl(slug: string, expectedType: 'article' | 'guide' | 'tool' | 'knowledge_base', userId?: string): Promise<RenderableContentObject | null> {
  const article = await getKnowledgeArticleBySlug(slug);
  if (!article || !article.published) return null;
  if ((article.contentType ?? 'article') !== expectedType) return null;

  if (article.accessTier && userId) {
    const userGrant = await getUserAccessGrant(userId);
    if (!userGrant || !hasSufficientTier(userGrant.tier, article.accessTier)) {
      return null; // User does not have sufficient access
    }
  }

  return toRenderableKnowledgeArticle(article);
}

export async function resolveServiceBySlug(slug: string): Promise<RenderableContentObject | null> {
  const service = await getServicePageBySlug(slug);
  if (!service || !service.published) return null;
  return toRenderableServicePage(service);
}

export async function resolveRelatedContentCards(content: RenderableContentObject): Promise<Array<{ id: string; title: string; path?: string; contentType: string }>> {
  if (!content.relatedContent?.length) return [];
  const services = await getPublishedServicePages();
  const serviceById = new Map(services.map((s) => [s.id, s]));

  return content.relatedContent.map((item) => {
    if (item.title) return { id: item.id, title: item.title, path: item.path, contentType: item.contentType };
    const service = serviceById.get(item.id);
    if (service) return { id: item.id, title: service.title, path: item.path ?? `/services/${service.slug}`, contentType: item.contentType };
    return { id: item.id, title: item.id, path: item.path, contentType: item.contentType };
  });
}
