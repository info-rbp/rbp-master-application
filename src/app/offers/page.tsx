import { buildSeoMetadata } from '@/lib/seo';
import { getActivePartnerOffers } from '@/lib/data';
import {
  HeroSection,
  OverviewSection,
  CurrentOffersSection,
  WhoTheyAreForSection,
  HowItWorksSection,
  CtaSection
} from '@/components/offers-landing';

export const metadata = buildSeoMetadata({ title: 'Partner Offers', description: 'Exclusive offers and discounts on software and services for your business.', path: '/offers' });

export const revalidate = 300;

export default async function OffersPage() {
  const offers = await getActivePartnerOffers();

  return (
    <div className="flex flex-col">
      <HeroSection />
      <OverviewSection />
      <CurrentOffersSection offers={offers} />
      <WhoTheyAreForSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  );
}
