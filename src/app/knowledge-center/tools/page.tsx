import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getKnowledgeArticles } from '@/lib/data';
import { filterPublishedKnowledgeItems } from '@/lib/public-catalogue';

export default async function ToolsPage() {
  const rawTools = await getKnowledgeArticles({ type: 'tool', published: true, sortBy: 'publishedAt' });
  const tools = filterPublishedKnowledgeItems(rawTools);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Tools & Templates</h1></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {tools.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published tools available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <PublicCatalogueCard key={tool.id} title={tool.title} href={tool.externalLink || `/knowledge-center/tools/${tool.slug}`} summary={tool.summary ?? tool.excerpt} category={tool.category ?? 'Tool'} tags={tool.tags} requiredTier={tool.entitlement?.accessTier} previewEnabled={tool.entitlement?.previewEnabled} imageUrl={tool.imageUrl} metadata={[tool.externalLink ? 'External tool' : 'Internal detail page']} ctaLabel={tool.ctaLabel ?? 'View tool'} />)}</div>
      </div></section>
    </div>
  );
}
