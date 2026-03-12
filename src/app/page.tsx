import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getActivePartnerOffers, getHomepageContent, getKnowledgeArticles, getPublishedServicePages, getPublishedTestimonials } from '@/lib/data';

export const metadata = buildSeoMetadata({ title: 'Home', description: 'Browse services, DocuShare resources, partner offers, and knowledge content for growing businesses.', path: '/' });

export const revalidate = 300;

export default async function HomePage() {
  const [content, testimonials, offers, knowledge, services] = await Promise.all([
    getHomepageContent(),
    getPublishedTestimonials(),
    getActivePartnerOffers(),
    getKnowledgeArticles({ published: true, sortBy: 'publishedAt' }),
    getPublishedServicePages(),
  ]);
  const whatWeDo = content?.sections?.find((section) => section.id === 'what-we-do')?.items ?? [];

  return (
    <div className="flex flex-col">
      <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">{content?.title ?? 'Remote Business Partner Catalogue'}</h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Explore services, DocuShare resources, partner offers, and knowledge content in one public catalogue.'}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg"><Link href="/docushare">Browse DocuShare</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/membership">Compare Membership</Link></Button>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 grid gap-4 md:grid-cols-4">
          <Link className="rounded-lg border p-4 hover:border-primary" href="/docushare">DocuShare Library</Link>
          <Link className="rounded-lg border p-4 hover:border-primary" href="/partner-offers">Partner Marketplace</Link>
          <Link className="rounded-lg border p-4 hover:border-primary" href="/knowledge-center">Knowledge Center</Link>
          <Link className="rounded-lg border p-4 hover:border-primary" href="/services">Advisory Services</Link>
        </div>
      </section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">{(whatWeDo.length ? whatWeDo : [{ title: 'Advisory on Demand', description: 'Expert guidance across strategy, finance, and operations.' }]).map((item) => <Card key={item.title}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="text-muted-foreground">{item.description}</CardContent></Card>)}</div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-muted/40"><div className="container mx-auto px-4 md:px-6"><h2 className="mb-8 text-3xl font-bold">Featured catalogue value</h2><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{offers.slice(0, 1).map((offer) => <PublicCatalogueCard key={offer.id} title={offer.title} href={`/partner-offers/${offer.slug ?? offer.id}`} summary={offer.summary ?? offer.description} category={offer.partnerName ?? 'Partner offer'} requiredTier={offer.entitlement?.accessTier} previewEnabled={offer.entitlement?.previewEnabled} imageUrl={offer.imageUrl} ctaLabel="View offer" />)}{knowledge.slice(0, 1).map((item) => <PublicCatalogueCard key={item.id} title={item.title} href={`/knowledge-center/${item.contentType === 'guide' ? 'guides' : item.contentType === 'tool' ? 'tools' : item.contentType === 'knowledge_base' ? 'knowledge' : 'articles'}/${item.slug}`} summary={item.summary ?? item.excerpt} category={item.contentType} tags={item.tags} ctaLabel="Read" />)}{services.slice(0, 1).map((service) => <PublicCatalogueCard key={service.id} title={service.title} href={`/services/${service.slug}`} summary={service.shortDescription} category="Service" requiredTier={service.entitlement?.accessTier} ctaLabel="View service" />)}</div></div></section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 grid max-w-5xl grid-cols-1 gap-8 pt-12 lg:grid-cols-2">
          {testimonials.slice(0, 2).map((testimonial) => <Card key={testimonial.id}><CardContent className="p-6"><p className="text-muted-foreground">“{testimonial.content}”</p><div className="mt-4"><p className="font-semibold">{testimonial.clientName}</p></div></CardContent></Card>)}
        </div>
      </section>
    </div>
  );
}
