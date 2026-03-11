import { ManagedDetailPage } from '@/components/public/managed-detail-page';
import { getServicePageBySlug } from '@/lib/data';

const fallbackFeatures = [
  { title: 'Advisory support', description: 'Specialist support tailored to your goals.' },
  { title: 'Execution assistance', description: 'Hands-on implementation support for critical initiatives.' },
  { title: 'Outcomes focus', description: 'Clear, measurable outcomes and accountability.' },
];

export default async function ServicePage() {
  const content = await getServicePageBySlug('management');

  return (
    <ManagedDetailPage
      title={content?.title ?? 'Management Consulting'}
      description={content?.shortDescription ?? 'Improve execution with practical management systems.'}
      heroImageUrl={content?.heroImageUrl}
      features={(content?.features && content.features.length > 0 ? content.features : fallbackFeatures)}
      ctaTitle="Ready to Optimise Your Management Systems?"
      ctaDescription="Let's discuss how we can tailor our expertise to your business needs."
      ctaLabel={content?.ctaLabel ?? 'Book a Free Consultation'}
      ctaHref={content?.ctaHref ?? '/contact'}
    />
  );
}
