import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicCatalogueCard } from '@/components/public/public-catalogue-card';
import { getActivePartnerOffers, getHomepageContent, getKnowledgeArticles, getPublishedServicePages, getPublishedTestimonials } from '@/lib/data';
import images from '@/lib/placeholder-images.json';

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
        <section className="relative bg-background overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="py-20 md:py-32 lg:py-40">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">Innovative Solutions for Lasting Impact</h1>
                        <p className="mt-6 text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Explore services, DocuShare resources, partner offers, and knowledge content in one public catalogue.'}</p>
                        <div className="mt-8 flex gap-4">
                            <Button asChild size="lg"><Link href="/contact-one">Let's connect</Link></Button>
                        </div>
                    </div>
                    <div className="hidden md:block relative h-[600px]">
                        <Image src={images.hero.src} alt="home three image one" width={images.hero.width} height={images.hero.height} className="rounded-lg absolute top-0 left-0 w-3/5" />
                        <Image src={images.homeHero.src} alt="home three image two" width={images.homeHero.width} height={images.homeHero.height} className="rounded-lg absolute top-1/4 -right-16 w-3/4" />
                        <Image src={images.servicesHero.src} alt="home three image three" width={images.servicesHero.width} height={images.servicesHero.height} className="rounded-lg absolute bottom-0 left-1/4 w-3/5" />
                    </div>
                </div>
            </div>
        </section>

        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-2 items-center">
                    <div className="space-y-4">
                        <div className="inline-block bg-primary text-primary-foreground py-1 px-3 rounded-full text-sm font-semibold">About Conselo</div>
                        <h2 className="text-3xl font-bold tracking-tight">Empowering Businesses to Achieve Goals with Strategic Consulting Solutions</h2>
                        <div className="flex items-center space-x-4">
                            <div className="text-6xl font-bold text-primary">13+</div>
                            <div className="text-lg text-muted-foreground">Years of Experience</div>
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {whatWeDo.map((item) => (
                            <Card key={item.title}>
                                <CardHeader className="flex flex-row items-center space-x-4">
                                    <Image src={images.hero.src} alt="" width={32} height={32} className="w-8 h-8" />
                                    <CardTitle>{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="w-full py-16 md:py-24 bg-muted/40">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center space-y-4">
                    <div className="inline-block bg-primary text-primary-foreground py-1 px-3 rounded-full text-sm font-semibold">News & Articles</div>
                    <h2 className="text-3xl font-bold tracking-tight">Browse Our Latest News & Articles On Conselo</h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    {offers.slice(0, 1).map((offer) => <PublicCatalogueCard key={offer.id} title={offer.title} href={`/partner-offers/${offer.slug ?? offer.id}`} summary={offer.summary ?? offer.description} category={offer.partnerName ?? 'Partner offer'} requiredTier={offer.entitlement?.accessTier} previewEnabled={offer.entitlement?.previewEnabled} imageUrl={offer.imageUrl} ctaLabel="View offer" />)}
                    {knowledge.slice(0, 1).map((item) => <PublicCatalogueCard key={item.id} title={item.title} href={`/knowledge-center/${item.contentType === 'guide' ? 'guides' : item.contentType === 'tool' ? 'tools' : item.contentType === 'knowledge_base' ? 'knowledge' : 'articles'}/${item.slug}`} summary={item.summary ?? item.excerpt} category={item.contentType} tags={item.tags} ctaLabel="Read" />)}
                    {services.slice(0, 1).map((service) => <PublicCatalogueCard key={service.id} title={service.title} href={`/services/${service.slug}`} summary={service.shortDescription} category="Service" requiredTier={service.entitlement?.accessTier} ctaLabel="View service" />)}
                </div>
            </div>
        </section>

        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-2 items-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Empowering Your Business for Long-Term Growth</h2>
                        <p className="text-muted-foreground">Let's make something great work together. <Link href="/contact-one" className="text-primary font-semibold hover:underline">Got a project in mind?</Link></p>
                    </div>
                    <div className="space-y-8">
                        {testimonials.slice(0, 2).map((testimonial) => (
                            <Card key={testimonial.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <Image src={images.testimonial1.src} alt="" width={48} height={48} className="w-12 h-12 rounded-full" />
                                        <div>
                                            <div className="font-semibold">{testimonial.clientName}</div>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground">“{testimonial.content}”</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
}
