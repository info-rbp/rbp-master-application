import type { PartnerOffer } from '@/lib/definitions';

export const categories = {
  top: { name: 'Top Offers', description: 'Most valuable currently active partner offers.' },
  new: { name: 'New Offers', description: 'Recently added partner opportunities.' },
  exclusive: { name: 'Exclusive Deals', description: 'Member-priority offers and negotiated discounts.' },
  our: { name: 'Our Picks', description: 'Recommended offers selected by our team.' },
  all: { name: 'All Partners', description: 'Browse every active partner marketplace offer.' },
};

export type OfferCategory = keyof typeof categories;

export type Offer = {
  id: string;
  partner: string;
  title: string;
  summary: string;
  href: string;
  categories: OfferCategory[];
  accessTier?: string;
  category?: string;
  expiresAt?: string | null;
  imageUrl?: string;
};

export function getOfferCategories(index: number, total: number, explicit?: string[]): OfferCategory[] {
  const fromDoc = Array.isArray(explicit)
    ? explicit.filter((x): x is OfferCategory => x in categories)
    : [];

  const categoriesForOffer: OfferCategory[] = fromDoc.length > 0 ? [...fromDoc, 'all'] : ['all', 'our'];
  if (fromDoc.length === 0) {
    if (index < 3) categoriesForOffer.push('top');
    if (index < 6) categoriesForOffer.push('new');
    if (index % 2 === 0 || total <= 2) categoriesForOffer.push('exclusive');
  }

  return Array.from(new Set(categoriesForOffer));
}

export function toOfferView(offer: PartnerOffer, index = 0, total = 1): Offer {
  return {
    id: offer.id,
    partner: offer.partnerName ?? offer.title,
    title: offer.title,
    summary: offer.summary ?? offer.description,
    href: `/partner-offers/${offer.slug ?? offer.id}`,
    categories: getOfferCategories(index, total, offer.categories),
    accessTier: offer.entitlement?.accessTier,
    category: offer.categories?.[0],
    expiresAt: offer.expiresAt,
    imageUrl: offer.imageUrl,
  };
}
