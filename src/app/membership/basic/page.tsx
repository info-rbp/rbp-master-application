import { ManagedDetailPage } from '@/components/public/managed-detail-page';
import { getPageContentBySlug } from '@/lib/data';

const fallbackFeatures = [
  { title: 'Curated resources', description: 'Actionable templates, guides, and playbooks.' },
  { title: 'Expert insights', description: 'Practical guidance tailored to business stage.' },
  { title: 'Execution support', description: 'Implementation-focused support where needed.' },
];

export default async function MembershipTierPage() {
  const content = await getPageContentBySlug('membership-basic');
  const features = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackFeatures;

  return (
    <ManagedDetailPage
      title={content?.title ?? 'Basic Membership'}
      description={content?.description ?? 'Ideal for individuals and early-stage startups.'}
      heroImageUrl={content?.heroImageUrl}
      introTitle={content?.sections?.[0]?.title ?? 'Core Features'}
      introDescription={content?.sections?.[0]?.description ?? 'Explore what is included in this membership tier.'}
      features={features}
      ctaTitle={content?.sections?.[1]?.title ?? 'Ready to get started?'}
      ctaDescription={content?.sections?.[1]?.description ?? 'Start your membership and unlock resources immediately.'}
      ctaLabel={content?.ctaLabel ?? 'Get Started'}
      ctaHref={content?.ctaHref ?? '/signup'}
      price="$0/Free Forever"
    />
  );
}
