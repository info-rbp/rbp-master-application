import { ManagedDetailPage } from '@/components/public/managed-detail-page';
import { getPageContentBySlug } from '@/lib/data';

const fallbackFeatures = [
  { title: 'Tier-aware catalogue access', description: 'See required access tier on resources, offers, and services before joining.' },
  { title: 'Public previews', description: 'Review summaries, categories, and value metadata across the catalogue.' },
  { title: 'Upgrade path', description: 'Move up when you need deeper implementation support and expanded access.' },
];

export default async function MembershipTierPage() {
  const content = await getPageContentBySlug('membership-premium');
  const features = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackFeatures;

  return (
    <ManagedDetailPage
      title={content?.title ?? 'Premium Membership'}
      description={content?.description ?? 'Bespoke support and strategic partnership for established teams.'}
      heroImageUrl={content?.heroImageUrl}
      introTitle={content?.sections?.[0]?.title ?? 'Included Value'}
      introDescription={content?.sections?.[0]?.description ?? 'Explore what is included in this tier and what catalogue value is visible publicly.'}
      features={features}
      ctaTitle={content?.sections?.[1]?.title ?? 'Ready to get started?'}
      ctaDescription={content?.sections?.[1]?.description ?? 'Start your membership and unlock deeper access.'}
      ctaLabel={content?.ctaLabel ?? 'Get Started'}
      ctaHref={content?.ctaHref ?? '/contact'}
      price="Custom"
    />
  );
}
