import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKnowledgeArticleBySlug } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getKnowledgeArticleBySlug(slug);
  if (!article || article.contentType !== 'tool') notFound();

  return <article className="container mx-auto px-4 md:px-6 py-16 max-w-4xl"><h1 className="text-4xl font-bold mb-4">{article.title}</h1><p className="text-muted-foreground whitespace-pre-wrap mb-6">{article.content}</p>{article.externalLink && <Button asChild><Link href={article.externalLink}>{article.ctaLabel || 'Open tool'}</Link></Button>}</article>;
}
