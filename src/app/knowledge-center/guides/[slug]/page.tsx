import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveKnowledgeBySlug } from '@/lib/content-routing';

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveKnowledgeBySlug(slug, 'guide');
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
