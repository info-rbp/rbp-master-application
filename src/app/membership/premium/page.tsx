import { ManagedDetailPage } from '@/components/public/managed-detail-page';
import { getPageContentBySlug } from '@/lib/data';

const fallbackFeatures = [
  { title: 'Curated resources', description: 'Actionable templates, guides, and playbooks.' },
  { title: 'Expert insights', description: 'Practical guidance tailored to business stage.' },
  { title: 'Execution support', description: 'Implementation-focused support where needed.' },
];

export default async function MembershipTierPage() {
  const content = await getPageContentBySlug('membership-premium');
  const features = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackFeatures;

  return (
    <ManagedDetailPage
      title={content?.title ?? 'Premium Membership'}
      description={content?.description ?? 'Bespoke support and strategic partnership for established teams.'}
      heroImageUrl={content?.heroImageUrl}
      introTitle={content?.sections?.[0]?.title ?? 'Core Features'}
      introDescription={content?.sections?.[0]?.description ?? 'Explore what is included in this membership tier.'}
      features={features}
      ctaTitle={content?.sections?.[1]?.title ?? 'Ready to get started?'}
      ctaDescription={content?.sections?.[1]?.description ?? 'Start your membership and unlock resources immediately.'}
      ctaLabel={content?.ctaLabel ?? 'Get Started'}
      ctaHref={content?.ctaHref ?? '/contact'}
      price="Custom"
    />
  );
}
