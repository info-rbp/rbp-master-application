import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getKnowledgeArticles, getKnowledgeLandingContent } from '@/lib/data';

const fallbackCategories = [
  { title: 'Articles', description: 'In-depth articles and analysis.', href: '/knowledge-center/articles' },
  { title: 'Guides & Playbooks', description: 'Practical, step-by-step business guides.', href: '/knowledge-center/guides' },
  { title: 'Tools & Templates', description: 'Downloadable templates and practical tools.', href: '/knowledge-center/tools' },
  { title: 'Knowledge Base', description: 'Searchable definitions and FAQ content.', href: '/knowledge-center/knowledge' },
];

export default async function KnowledgeCenterPage() {
  const [content, featuredItems] = await Promise.all([
    getKnowledgeLandingContent(),
    getKnowledgeArticles({ published: true, sortBy: 'publishedAt' }),
  ]);
  const categories = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCategories;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{content?.title ?? 'Knowledge Center'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Browse published articles, guides, tools, and knowledge entries.'}</p>
          <div className="mt-6"><Button asChild variant="outline"><Link href="/search">Search full catalogue</Link></Button></div>
        </div>
      </section>
      <section className="py-12"><div className="container mx-auto px-4 md:px-6"><div className="grid gap-8 md:grid-cols-2">{categories.map((category) => <div key={category.title} className="rounded-lg border p-6"><h2 className="text-xl font-semibold">{category.title}</h2><p className="mt-2 text-muted-foreground">{category.description}</p><Button variant="outline" asChild className="mt-4"><Link href={category.href ?? '/knowledge-center'}>Browse {category.title}</Link></Button></div>)}</div></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6"><h2 className="mb-8 text-3xl font-bold">Featured knowledge</h2><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{featuredItems.slice(0, 3).map((item) => <PublicCatalogueCard key={item.id} title={item.title} href={`/knowledge-center/${item.contentType === 'guide' ? 'guides' : item.contentType === 'tool' ? 'tools' : item.contentType === 'knowledge_base' ? 'knowledge' : 'articles'}/${item.slug}`} summary={item.summary ?? item.excerpt} category={item.contentType?.replace('_', ' ')} tags={item.tags} imageUrl={item.imageUrl} requiredTier={item.entitlement?.accessTier} previewEnabled={item.entitlement?.previewEnabled} ctaLabel="Open" />)}</div></div></section>
    </div>
  );
}
