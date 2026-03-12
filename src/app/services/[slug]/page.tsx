import { buildContentMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveServiceBySlug } from '@/lib/content-routing';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveServiceBySlug(slug);
  if (!content) return buildContentMetadata({ title: 'Not found' }, '/services/');
  return buildContentMetadata(content, `/services/${slug}`);
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveServiceBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
