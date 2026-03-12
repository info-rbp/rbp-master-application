import type { DocumentSuite, KnowledgeArticle, PartnerOffer } from './definitions';

export function isPublishedDocushareSuite(suite: Pick<DocumentSuite, 'status'>): boolean {
  return (suite.status ?? 'published') === 'published';
}

export function isPublishedKnowledgeItem(item: Pick<KnowledgeArticle, 'published'>): boolean {
  return item.published === true;
}

export function isActivePartnerOffer(offer: Pick<PartnerOffer, 'active'>): boolean {
  return offer.active === true;
}

export function filterPublishedDocushareSuites<T extends Pick<DocumentSuite, 'status'>>(suites: T[]): T[] {
  return suites.filter(isPublishedDocushareSuite);
}

export function filterPublishedKnowledgeItems<T extends Pick<KnowledgeArticle, 'published'>>(items: T[]): T[] {
  return items.filter(isPublishedKnowledgeItem);
}

export function filterActivePartnerOffers<T extends Pick<PartnerOffer, 'active'>>(offers: T[]): T[] {
  return offers.filter(isActivePartnerOffer);
}
