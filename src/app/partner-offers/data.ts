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

export function toOfferView(offer: PartnerOffer): Offer {
  return {
    id: offer.id,
    partner: offer.title,
    title: offer.title,
    description: offer.description,
    href: offer.link,
    categories: ['all', 'top', 'new', 'exclusive', 'our'],
  };
}
