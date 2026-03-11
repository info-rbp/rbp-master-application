import { notFound } from 'next/navigation';
import { getKnowledgeArticleBySlug } from '@/lib/data';

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getKnowledgeArticleBySlug(slug);
  if (!article || article.contentType !== 'guide') notFound();

  return <article className="container mx-auto px-4 md:px-6 py-16 max-w-4xl"><h1 className="text-4xl font-bold mb-4">{article.title}</h1><p className="text-muted-foreground whitespace-pre-wrap">{article.content}</p></article>;
}
