import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { DiscoveryFilters } from '@/components/public/discovery-filters';
import { safeLogAnalyticsEvent } from '@/lib/analytics';
import { applyDiscoveryFilters, getDiscoveryFilterOptions, getPublicDiscoveryItems, type DiscoveryFilters as DiscoveryQueryFilters } from '@/lib/discovery';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const values: DiscoveryQueryFilters = {
    keyword: typeof params.keyword === 'string' ? params.keyword : undefined,
    category: typeof params.category === 'string' ? params.category : 'all',
    tag: typeof params.tag === 'string' ? params.tag : 'all',
    contentType: typeof params.contentType === 'string' ? params.contentType : 'all',
    tier: typeof params.tier === 'string' && ['all', 'basic', 'standard', 'premium'].includes(params.tier) ? (params.tier as DiscoveryQueryFilters['tier']) : 'all',
  };

  const items = await getPublicDiscoveryItems();
  const filtered = applyDiscoveryFilters(items, values);
  const options = getDiscoveryFilterOptions(items);

  if (values.keyword || values.category !== 'all' || values.tag !== 'all' || values.contentType !== 'all' || values.tier !== 'all') {
    await safeLogAnalyticsEvent({
      eventType: 'catalogue_search_performed',
      targetType: 'public_catalogue',
      metadata: { ...values, resultCount: filtered.length },
    });
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Search the catalogue</h1>
        <p className="mt-3 text-muted-foreground">Find templates, guides, partner offers, services, and knowledge resources from one place.</p>
      </div>

      <DiscoveryFilters action="/search" values={values} options={options} />

      <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length === 1 ? '' : 's'} found.</p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">No matching resources were found. Try a broader keyword, category, or membership tier.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <PublicCatalogueCard
              key={item.id}
              title={item.title}
              href={item.path}
              summary={item.summary}
              category={item.contentType.replaceAll('_', ' ')}
              tags={item.tags}
              requiredTier={item.accessTier}
              imageUrl={item.thumbnailUrl}
              metadata={[item.category ? `Category: ${item.category}` : 'General']}
              ctaLabel="Open resource"
            />
          ))}
        </div>
      )}
    </div>
  );
}
