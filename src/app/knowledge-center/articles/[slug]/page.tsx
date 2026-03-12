import { buildContentMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveKnowledgeBySlug } from '@/lib/content-routing';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveKnowledgeBySlug(slug, 'article');
  if (!content) return buildContentMetadata({ title: 'Not found' }, '/knowledge-center/articles/');
  return buildContentMetadata(content, `/knowledge-center/articles/${slug}`);
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveKnowledgeBySlug(slug, 'article');
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
