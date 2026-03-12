import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveDocushareDocumentBySlug } from '@/lib/content-routing';

export default async function DocushareResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveDocushareDocumentBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
