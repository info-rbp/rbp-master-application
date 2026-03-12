import type { PartnerOffer } from '@/lib/definitions';

export const categories = {
  top: { name: 'Top Strategic Deals', description: 'Our most valuable offers.' },
  new: { name: 'New Offers', description: 'Latest partner opportunities.' },
  exclusive: { name: 'Exclusive Deals', description: 'Member-exclusive offers.' },
  our: { name: 'Our Picks', description: 'Team-recommended offers.' },
  all: { name: 'All Offers', description: 'Browse every active partner offer.' },
};

export type OfferCategory = keyof typeof categories;

export type Offer = {
  id: string;
  partner: string;
  title: string;
  description: string;
  href: string;
  categories: OfferCategory[];
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
    description: offer.description,
    href: `/partner-offers/${offer.slug ?? offer.id}`,
    categories: getOfferCategories(index, total, offer.categories),
  };
}
