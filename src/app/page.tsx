import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Briefcase, Users, Handshake } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { getPublishedTestimonials } from '@/lib/data';

export default async function HomePage() {
  const { homeHero } = placeholderImages;
  const testimonials = await getPublishedTestimonials();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Your On-Demand Strategy, Finance & Operations Partner
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              We provide flexible, expert support to help your business navigate challenges and unlock growth.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Book a Free Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="what-we-do" className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  What We Do
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Embedded Expertise for Every Stage
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-lg">
                  Think of us as an extension of your team, bringing specialist skills in strategy, finance, and operations precisely when you need them.
                </p>
              </div>
              <ul className="grid gap-6">
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />Advisory on Demand</h3>
                    <p className="text-muted-foreground">
                      Access expert guidance on everything from capital raising to financial modeling.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />Fractional Executive</h3>
                    <p className="text-muted-foreground">
                      Embed a CFO, COO, or Head of Strategy into your business without the full-time cost.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />Project-Based Support</h3>
                    <p className="text-muted-foreground">
                      Get hands-on help to deliver critical projects like market entry or system implementations.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
             <Image
              src={homeHero.src}
              alt="Business meeting"
              width={homeHero.width}
              height={homeHero.height}
              data-ai-hint={homeHero.hint}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
            />
          </div>
        </div>
      </section>

      {/* Who We Help Section */}
      <section id="who-we-help" className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Who We Help
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Fueling Growth for Ambitious Businesses
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                We partner with innovators and leaders who are building the future.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-1 md:grid-cols-3">
              <Card className="text-left">
                <CardHeader>
                  <Briefcase className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Startups & Scaleups</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">From seed stage to series C, we provide the strategic and operational horsepower to help you scale effectively.</p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>SMEs & Mid-Market</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">We help established businesses modernize operations, explore new markets, and drive sustainable growth.</p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardHeader>
                  <Handshake className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Investors & VCs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">We offer due diligence support and portfolio company assistance to help you maximize returns.</p>
                </CardContent>
              </Card>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Testimonials
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                What Our Partners Say
              </h2>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 pt-12 lg:grid-cols-2">
            {testimonials.length === 0 ? (
              <Card className="lg:col-span-2"><CardContent className="p-6 text-muted-foreground">No testimonials published yet.</CardContent></Card>
            ) : (
              testimonials.slice(0, 2).map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">“{testimonial.content}”</p>
                    <div className="mt-4">
                      <p className="font-semibold">{testimonial.clientName}</p>
                      <p className="text-sm text-muted-foreground">{[testimonial.role, testimonial.company].filter(Boolean).join(', ') || 'Client'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
              <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Accelerate Your Growth?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl">
                  Let's discuss how we can help your business achieve its goals. Schedule a free, no-obligation consultation today.
              </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                   <Button asChild size="lg" variant="secondary">
                      <Link href="/contact">Book a Free Consultation</Link>
                  </Button>
              </div>
          </div>
      </section>
    </div>
  );
}
