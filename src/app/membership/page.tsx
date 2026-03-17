import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getActivePartnerOffers, getMembershipPageContent, getPublishedServicePages } from '@/lib/data';
import { Check } from 'lucide-react';

const fallbackCards = [
  { title: 'Basic Membership', description: 'Essential resources to get your business started.', href: '/membership/basic' },
  { title: 'Standard Membership', description: 'Advanced tools and content for growing businesses.', href: '/membership/standard' },
  { title: 'Premium Membership', description: 'Bespoke support and expert access for established teams.', href: '/membership/premium' },
  { title: 'FAQ', description: 'Find answers to common membership questions.', href: '/membership/faq' },
];

const platformPillars = [
    { name: 'DocShare', description: 'Access a library of templates, guides, and AI-generated documents.' },
    { name: 'Partner Marketplace', description: 'Discover offers from trusted partners.' },
    { name: 'Knowledge Center', description: 'Learn from articles, case studies, and playbooks.' },
    { name: 'Advisory Services', description: 'Get expert guidance on your business challenges.' },
    { name: 'Support', description: 'Receive help with platform features and implementation.' },
];

const howItWorks = [
    { step: 1, title: 'Explore Resources', description: 'Browse the library of templates, guides, and tools to identify what you need.' },
    { step: 2, title: 'Implement Systems', description: 'Use our frameworks and AI tools to generate documents and build business systems.' },
    { step: 3, title: 'Improve and Scale', description: 'Leverage advisory services and expert review to refine your operations and grow.' },
];

const keyFeatures = [
    'AI Document Generator',
    'Business Systems Library (DocShare)',
    'Partner Marketplace',
    'Business Advisory Access',
    'Implementation Support',
];

export const metadata = buildSeoMetadata({ title: 'Membership Plans', description: 'Compare membership tiers, benefits, and upgrade paths.' });

export const revalidate = 300;

export default async function MembershipPage() {
  const [content, offers, services] = await Promise.all([getMembershipPageContent(), getActivePartnerOffers(), getPublishedServicePages()]);
  const cards = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCards;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{'Unlock Your Business Potential'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{'Access the tools, resources, and expert support you need to improve operations and scale your business.'}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg"><Link href="#plans">View Plans</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/membership/basic">Explore Features</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">The Ultimate Platform for Business Improvement</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Everything you need to build a more efficient, scalable business.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                {platformPillars.map((pillar) => (
                    <div key={pillar.name} className="text-center">
                        <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground">
                            {/* Icon would go here */}
                        </div>
                        <h3 className="text-xl font-bold">{pillar.name}</h3>
                        <p className="mt-2 text-muted-foreground">{pillar.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">A simple, three-step path to business improvement.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                {howItWorks.map((item) => (
                    <div key={item.step} className="p-6 rounded-lg border">
                        <div className="text-3xl font-bold text-primary mb-4">Step {item.step}</div>
                        <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Key Platform Features</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">The tools you need to succeed.</p>
            </div>
            <div className="max-w-4xl mx-auto">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {keyFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-4">
                            <Check className="h-6 w-6 text-primary" />
                            <span className="text-lg">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </section>

      <section id="plans" className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Choose Your Plan</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Select the right membership tier for your business needs.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title} className="flex flex-col">
                <CardHeader><CardTitle className="text-center text-2xl">{card.title}</CardTitle></CardHeader>
                <CardContent className="flex-grow text-center"><p className="text-muted-foreground">{card.description}</p></CardContent>
                <CardFooter><Button asChild className="w-full"><Link href={card.href ?? '/membership'}>View Plan</Link></Button></CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

       <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Transform Your Business?</h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">Join today and start building a better business.</p>
          <div className="mt-8">
            <Button asChild size="lg"><Link href="#plans">Choose Your Plan</Link></Button>
          </div>
        </div>
      </section>

    </div>
  );
}
