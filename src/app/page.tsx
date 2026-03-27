import { buildSeoMetadata } from '@/lib/seo';
import { getPublishedTestimonials, getKnowledgeArticles } from '@/lib/data';
import {
  HeroSection,
  PathwayCardsSection,
  TrustProofSection,
  HowItWorksSection,
  FeaturedResourcesSection,
  CtaBlockSection
} from '@/components/landing-page';

export const metadata = buildSeoMetadata({ title: 'Strategic Solutions for Business Growth', description: 'We help you navigate complexity and achieve your most ambitious goals. Let\'s build the future of your business, together.', path: '/' });

export const revalidate = 300;

export default async function HomePage() {
  const [testimonials, resources] = await Promise.all([
    getPublishedTestimonials(),
    getKnowledgeArticles({ published: true, sortBy: 'publishedAt' }),
  ]);

  return (
    <div className="flex flex-col">
      <HeroSection />
      <PathwayCardsSection />
      <TrustProofSection testimonials={testimonials} />
      <HowItWorksSection />
      <FeaturedResourcesSection resources={resources} />
      <CtaBlockSection />
    </div>
  );
}
