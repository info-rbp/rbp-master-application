import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPublishedServicePages, getServicesLandingContent } from '@/lib/data';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';

export default async function ServicesPage() {
  const [pageContent, services] = await Promise.all([getServicesLandingContent(), getPublishedServicePages()]);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{pageContent?.title ?? 'Advisory on Demand'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{pageContent?.description ?? 'Browse published advisory services and compare where membership can help reduce delivery costs.'}</p>
          <div className="mt-6"><Button asChild variant="outline"><Link href="/search?contentType=service_page">Search services and related resources</Link></Button></div>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {services.map((service) => (
              <PublicCatalogueCard
                key={service.id}
                title={service.title}
                href={`/services/${service.slug}`}
                summary={service.shortDescription}
                category="Service"
                requiredTier={service.entitlement?.accessTier}
                previewEnabled={service.entitlement?.previewEnabled}
                imageUrl={service.heroImageUrl}
                metadata={[
                  service.entitlement?.isLimitedAccess ? 'Membership discount eligible' : 'Standard engagement',
                  service.ctaHref ? 'Discovery call CTA ready' : 'Contact CTA available',
                ]}
                ctaLabel="View service"
              />
            ))}
          </div>
          <div className="mt-16 text-center">
            <Button size="lg" asChild><Link href={pageContent?.ctaHref ?? '/contact'}>{pageContent?.ctaLabel ?? 'Book a Free Consultation'}</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
