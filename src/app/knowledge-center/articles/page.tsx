import { getKnowledgeArticles } from '@/lib/data';
import { filterPublishedKnowledgeItems } from '@/lib/public-catalogue';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';

export default async function ArticlesPage() {
  const rawArticles = await getKnowledgeArticles({ type: 'article', published: true, sortBy: 'publishedAt' });
  const articles = filterPublishedKnowledgeItems(rawArticles);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Articles</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">In-depth, published business insights and analysis.</p>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {articles.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published articles available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <PublicCatalogueCard key={article.id} title={article.title} href={`/knowledge-center/articles/${article.slug}`} summary={article.summary ?? article.excerpt} category={article.category ?? 'Article'} tags={article.tags} requiredTier={article.entitlement?.accessTier} previewEnabled={article.entitlement?.previewEnabled} imageUrl={article.imageUrl} metadata={[article.featured ? 'Featured' : 'Published']} ctaLabel="Read article" />)}</div>
      </div></section>
    </div>
  );
}
