import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublishedServicePages, getServicesLandingContent } from '@/lib/data';

export default async function ServicesPage() {
  const [pageContent, services] = await Promise.all([getServicesLandingContent(), getPublishedServicePages()]);

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{pageContent?.title ?? 'Advisory on Demand'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{pageContent?.description ?? 'Flexible, expert support to help your business navigate challenges and unlock growth.'}</p>
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col">
                <CardHeader><CardTitle>{service.title}</CardTitle></CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-muted-foreground">{service.shortDescription}</p>
                  <Button asChild variant="outline"><Link href={`/services/${service.slug}`}>Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
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
