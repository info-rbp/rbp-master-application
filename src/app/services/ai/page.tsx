import { ManagedDetailPage } from '@/components/public/managed-detail-page';
import { getServicePageBySlug } from '@/lib/data';

const fallbackFeatures = [
  { title: 'Advisory support', description: 'Specialist support tailored to your goals.' },
  { title: 'Execution assistance', description: 'Hands-on implementation support for critical initiatives.' },
  { title: 'Outcomes focus', description: 'Clear, measurable outcomes and accountability.' },
];

export default async function ServicePage() {
  const content = await getServicePageBySlug('ai');

  return (
    <ManagedDetailPage
      title={content?.title ?? 'AI Strategy & Automation'}
      description={content?.shortDescription ?? 'Adopt AI in practical ways that create measurable value.'}
      heroImageUrl={content?.heroImageUrl}
      features={(content?.features && content.features.length > 0 ? content.features : fallbackFeatures)}
      ctaTitle="Ready to Unlock AI-Driven Growth?"
      ctaDescription="Let's discuss how we can tailor our expertise to your business needs."
      ctaLabel={content?.ctaLabel ?? 'Book a Free Consultation'}
      ctaHref={content?.ctaHref ?? '/contact'}
    />
  );
}
