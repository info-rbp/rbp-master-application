import type { Offer } from '../data';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';

export default function OfferCard({ offer }: { offer: Offer }) {
  return (
    <PublicCatalogueCard
      title={offer.title}
      href={offer.href}
      summary={offer.summary}
      category={offer.category ?? offer.partner}
      requiredTier={offer.accessTier}
      imageUrl={offer.imageUrl}
      metadata={[
        `Partner: ${offer.partner}`,
        offer.expiresAt ? `Valid until ${new Date(offer.expiresAt).toLocaleDateString()}` : 'No expiry listed',
      ]}
      ctaLabel="View offer"
    />
  );
}
