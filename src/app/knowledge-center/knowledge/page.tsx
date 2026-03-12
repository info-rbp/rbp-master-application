import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getKnowledgeArticles } from '@/lib/data';
import { filterPublishedKnowledgeItems } from '@/lib/public-catalogue';

export default async function KnowledgeBasePage() {
  const rawEntries = await getKnowledgeArticles({ type: 'knowledge_base', published: true, sortBy: 'publishedAt' });
  const entries = filterPublishedKnowledgeItems(rawEntries);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Knowledge Base</h1></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {entries.length === 0 ? <div className="rounded-lg border p-10 text-center text-muted-foreground">No published entries available yet.</div> : <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{entries.map((entry) => <PublicCatalogueCard key={entry.id} title={entry.title} href={`/knowledge-center/knowledge/${entry.slug}`} summary={entry.summary ?? entry.excerpt} category={entry.category ?? 'Knowledge base'} tags={entry.tags} requiredTier={entry.entitlement?.accessTier} previewEnabled={entry.entitlement?.previewEnabled} imageUrl={entry.imageUrl} ctaLabel="Read entry" />)}</div>}
      </div></section>
    </div>
  );
}
