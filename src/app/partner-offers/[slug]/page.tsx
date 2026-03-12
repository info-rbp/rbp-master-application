import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolvePartnerOfferBySlug } from '@/lib/content-routing';

export default async function PartnerOfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolvePartnerOfferBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
