import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicContentItem } from '@/lib/public-content';

export function ManagedDetailPage({
  title,
  description,
  heroImageUrl,
  introTitle,
  introDescription,
  features,
  ctaTitle,
  ctaDescription,
  ctaLabel,
  ctaHref,
  price,
}: {
  title: string;
  description: string;
  heroImageUrl?: string;
  introTitle?: string;
  introDescription?: string;
  features: PublicContentItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
  ctaHref: string;
  price?: string;
}) {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">{description}</p>
          {price ? <div className="mt-8 text-5xl font-bold">{price}</div> : null}
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            <div className="flex flex-col gap-8">
              {introTitle ? <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{introTitle}</h2> : null}
              {introDescription ? <p className="text-muted-foreground text-lg">{introDescription}</p> : null}
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <Check className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    {feature.description ? <p className="text-muted-foreground mt-1">{feature.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
            {heroImageUrl ? (
              <div className="relative h-full min-h-[400px]">
                <Image src={heroImageUrl} alt={title} width={1200} height={800} className="object-cover rounded-lg" />
              </div>
            ) : null}
          </div>
          <div className="mt-20 text-center bg-primary/10 p-8 rounded-lg">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{ctaTitle}</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">{ctaDescription}</p>
            <Button size="lg" className="mt-6" asChild>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
