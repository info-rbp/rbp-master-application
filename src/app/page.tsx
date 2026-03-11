import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHomepageContent, getPublishedTestimonials } from '@/lib/data';

export default async function HomePage() {
  const [content, testimonials] = await Promise.all([getHomepageContent(), getPublishedTestimonials()]);
  const whatWeDo = content?.sections?.find((section) => section.id === 'what-we-do')?.items ?? [];
  const whoWeHelp = content?.sections?.find((section) => section.id === 'who-we-help')?.items ?? [];

  return (
    <div className="flex flex-col">
      <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">{content?.title ?? 'Your On-Demand Strategy, Finance & Operations Partner'}</h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Flexible, expert support to help your business navigate challenges and unlock growth.'}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg"><Link href={content?.ctaHref ?? '/contact'}>{content?.ctaLabel ?? 'Book a Free Consultation'}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/services">Our Services</Link></Button>
          </div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">{(whatWeDo.length ? whatWeDo : [{ title: 'Advisory on Demand', description: 'Expert guidance across strategy, finance, and operations.' }]).map((item) => <Card key={item.title}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="text-muted-foreground">{item.description}</CardContent></Card>)}</div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">{(whoWeHelp.length ? whoWeHelp : [{ title: 'Startups & Scaleups', description: 'Practical support from early-stage through growth.' }]).map((item) => <Card key={item.title}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="text-muted-foreground">{item.description}</CardContent></Card>)}</div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 grid max-w-5xl grid-cols-1 gap-8 pt-12 lg:grid-cols-2">
          {testimonials.slice(0, 2).map((testimonial) => <Card key={testimonial.id}><CardContent className="p-6"><p className="text-muted-foreground">“{testimonial.content}”</p><div className="mt-4"><p className="font-semibold">{testimonial.clientName}</p></div></CardContent></Card>)}
        </div>
      </section>
    </div>
  );
}
