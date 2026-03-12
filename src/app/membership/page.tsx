import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getActivePartnerOffers, getMembershipPageContent, getPublishedServicePages } from '@/lib/data';

const fallbackCards = [
  { title: 'Basic Membership', description: 'Essential resources to get your business started.', href: '/membership/basic' },
  { title: 'Standard Membership', description: 'Advanced tools and content for growing businesses.', href: '/membership/standard' },
  { title: 'Premium Membership', description: 'Bespoke support and expert access for established teams.', href: '/membership/premium' },
  { title: 'FAQ', description: 'Find answers to common membership questions.', href: '/membership/faq' },
];

export default async function MembershipPage() {
  const [content, offers, services] = await Promise.all([getMembershipPageContent(), getActivePartnerOffers(), getPublishedServicePages()]);
  const cards = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCards;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{content?.title ?? 'Membership Plans'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Compare access tiers and see public catalogue value before you subscribe.'}</p>
        </div>
      </section>
      <section className="py-10"><div className="container mx-auto px-4 md:px-6"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border p-4">Active partner offers: <strong>{offers.length}</strong></div><div className="rounded-lg border p-4">Published advisory services: <strong>{services.length}</strong></div><div className="rounded-lg border p-4">Tier-aware catalogue previews are shown on each item.</div></div></div></section>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title} className="flex flex-col">
                <CardHeader><CardTitle className="text-center text-2xl">{card.title}</CardTitle></CardHeader>
                <CardContent className="flex-grow text-center"><p className="text-muted-foreground">{card.description}</p></CardContent>
                <CardFooter><Button asChild className="w-full" variant="outline"><Link href={card.href ?? '/membership'}>View tier details</Link></Button></CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
