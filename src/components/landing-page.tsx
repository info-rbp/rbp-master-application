'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';

// Section: Hero
export const HeroSection = () => (
  <section className="relative bg-background overflow-hidden py-20 md:py-32">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">Strategic Solutions for Business Growth</h1>
      <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">We help you navigate complexity and achieve your most ambitious goals. Let's build the future of your business, together.</p>
      <div className="mt-8 flex gap-4 justify-center">
        <Button asChild size="lg"><Link href="/advisory-booking">Book a Discovery Call</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/contact">Contact Us</Link></Button>
      </div>
    </div>
  </section>
);

// Section: Pathway Cards
const pathwayLinks = [
  { title: 'Services', description: 'Explore our consulting and managed services.', href: '/services', icon: 'Briefcase' },
  { title: 'DocuShare', description: 'Access our library of templates and documents.', href: '/docushare', icon: 'FileStack' },
  { title: 'Offers', description: 'View exclusive offers from our partners.', href: '/offers', icon: 'Gift' },
  { title: 'Applications', description: 'Discover our business applications and tools.', href: '/applications', icon: 'AppWindow' },
  { title: 'Resources', description: 'Read our latest articles, guides, and insights.', href: '/resources', icon: 'BookOpen' },
];

export const PathwayCardsSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {pathwayLinks.map((link) => (
          <Card key={link.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4">
              {/* <Icon name={link.icon} className="w-8 h-8 text-primary" /> */}
              <CardTitle>{link.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{link.description}</p>
              <Link href={link.href} className="mt-4 inline-flex items-center font-semibold text-primary">
                Learn more <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Section: Trust/Proof
export const TrustProofSection = ({ testimonials }) => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Trusted by Industry Leaders</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">We have a proven track record of delivering results for our clients. Here's what they have to say.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {testimonials.slice(0, 3).map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="p-6">
              <p className="text-muted-foreground">“{testimonial.content}”</p>
              <div className="flex items-center space-x-4 mt-4">
                 <Image src={testimonial.avatarUrl || 'https://via.placeholder.com/48'} alt={testimonial.clientName} width={48} height={48} className="w-12 h-12 rounded-full" /> 
                <div>
                  <div className="font-semibold">{testimonial.clientName}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.clientRole}, {testimonial.clientCompany}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Section: How It Works
const steps = [
  { title: 'Discovery Call', description: "We start with a conversation to understand your unique challenges and goals.", icon: 'Phone' },
  { title: 'Strategic Plan', description: "We develop a tailored plan that outlines our approach and expected outcomes.", icon: 'ClipboardList' },
  { title: 'Implementation', description: "We work with you to implement the plan, providing guidance and support every step of the way.", icon: 'Rocket' },
  { title: 'Review & Iterate', description: "We continuously monitor progress, making adjustments as needed to ensure success.", icon: 'RefreshCw' },
];

export const HowItWorksSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Our Process</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">A proven methodology for delivering results.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {steps.map((step, index) => (
          <div key={step.title} className="text-center">
             {/* <Icon name={step.icon} className="w-12 h-12 mx-auto text-primary" /> */}
            <h3 className="text-xl font-semibold mt-4">{index + 1}. {step.title}</h3>
            <p className="text-muted-foreground mt-2">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Section: Featured Resources
export const FeaturedResourcesSection = ({ resources }) => (
    <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Featured Resources</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Explore our latest insights and analysis.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {resources.slice(0, 3).map((item) => (
                     <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground line-clamp-3">{item.summary ?? item.excerpt}</p>
                            <Link href={`/resources/${item.contentType === 'guide' ? 'guides' : 'articles'}/${item.slug}`} className="mt-4 inline-flex items-center font-semibold text-primary">
                                Read more <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </section>
);


// Section: CTA Block
export const CtaBlockSection = () => (
  <section className="py-16 md:py-24 bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
      <p className="mt-4 max-w-2xl mx-auto">Let's talk about how we can help you achieve your goals. Schedule a free, no-obligation discovery call today.</p>
      <div className="mt-8">
        <Button asChild size="lg" variant="secondary"><Link href="/advisory-booking">Book a Discovery Call</Link></Button>
      </div>
    </div>
  </section>
);
