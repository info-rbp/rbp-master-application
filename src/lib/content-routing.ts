import { getDocumentBySlug, getPartnerOfferBySlug, getSuiteBySlug } from './data';
import { toRenderableDocument, toRenderableDocushareSuite, toRenderablePartnerOffer, type RenderableContentObject } from './content-objects';

export async function resolveDocushareSuiteBySlug(slug: string): Promise<RenderableContentObject | null> {
  const suite = await getSuiteBySlug(slug);
  if (!suite || suite.status === 'draft') return null;
  return toRenderableDocushareSuite(suite);
}

export async function resolveDocushareDocumentBySlug(slug: string): Promise<RenderableContentObject | null> {
  const document = await getDocumentBySlug(slug);
  if (!document || document.status === 'draft') return null;
  return toRenderableDocument(document);
}

export async function resolvePartnerOfferBySlug(slug: string): Promise<RenderableContentObject | null> {
  const offer = await getPartnerOfferBySlug(slug);
  if (!offer || !offer.active) return null;
  return toRenderablePartnerOffer(offer);
}
