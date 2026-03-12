import { buildContentMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveDocushareDocumentBySlug } from '@/lib/content-routing';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveDocushareDocumentBySlug(slug);
  if (!content) return buildContentMetadata({ title: 'Not found' }, '/docushare/resources/');
  return buildContentMetadata(content, `/docushare/resources/${slug}`);
}

export default async function DocushareResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveDocushareDocumentBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
