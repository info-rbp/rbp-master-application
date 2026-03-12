import { buildContentMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolvePartnerOfferBySlug } from '@/lib/content-routing';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolvePartnerOfferBySlug(slug);
  if (!content) return buildContentMetadata({ title: 'Not found' }, '/partner-offers/');
  return buildContentMetadata(content, `/partner-offers/${slug}`);
}

export default async function PartnerOfferDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolvePartnerOfferBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
