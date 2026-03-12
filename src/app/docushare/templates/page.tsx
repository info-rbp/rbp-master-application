import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDocumentSuites, getDocuShareSectionContent } from '@/lib/data';
import { filterPublishedDocushareSuites } from '@/lib/public-catalogue';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';

export default async function DocuShareCategoryPage() {
  const [content, allSuites] = await Promise.all([
    getDocuShareSectionContent('templates'),
    getDocumentSuites(),
  ]);
  const suites = filterPublishedDocushareSuites(allSuites).filter((suite) => suite.contentType === 'templates');

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{content?.title ?? 'Business & Legal Templates'}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Access a comprehensive library of templates.'}</p>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {suites.length === 0 ? <Alert><AlertTitle>No published content available</AlertTitle><AlertDescription>Content will appear here when published.</AlertDescription></Alert> : (
          <div className="grid gap-6 md:grid-cols-2">{suites.map((suite) => <PublicCatalogueCard key={suite.id} title={suite.name} href={`/docushare/templates/${suite.slug ?? suite.id}`} summary={suite.summary ?? suite.description} category={suite.category ?? 'Template'} tags={suite.tags} requiredTier={suite.entitlement?.accessTier} previewEnabled={suite.entitlement?.previewEnabled} imageUrl={suite.heroImageUrl} metadata={[`Resources: ${suite.documents.length}`]} ctaLabel="View template suite" />)}</div>
        )}
      </div></section>
    </div>
  );
}
