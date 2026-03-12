import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getKnowledgeArticles } from '@/lib/data';
import { filterPublishedKnowledgeItems } from '@/lib/public-catalogue';

export default async function GuidesPage() {
  const rawGuides = await getKnowledgeArticles({ type: 'guide', published: true, sortBy: 'publishedAt' });
  const guides = filterPublishedKnowledgeItems(rawGuides);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Guides & Playbooks</h1></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {guides.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published guides available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <PublicCatalogueCard key={guide.id} title={guide.title} href={`/knowledge-center/guides/${guide.slug}`} summary={guide.summary ?? guide.excerpt} category={guide.category ?? 'Guide'} tags={guide.tags} requiredTier={guide.entitlement?.accessTier} previewEnabled={guide.entitlement?.previewEnabled} imageUrl={guide.imageUrl} metadata={[guide.featured ? 'Featured' : 'Published']} ctaLabel="Read guide" />)}</div>
      </div></section>
    </div>
  );
}
