import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OfferCard from './components/offer-card';
import { categories, toOfferView } from './data';
import { getActivePartnerOffers } from '@/lib/data';

export const metadata = buildSeoMetadata({ title: 'Partner Marketplace', description: 'Browse active partner offers and compare membership value.', path: '/partner-offers' });

export const revalidate = 300;

export default async function PartnerOffersPage() {
  try {
    const activeOffers = await getActivePartnerOffers();
    const offers = activeOffers.map((offer, index) => toOfferView(offer, index, activeOffers.length));
    const topOffers = offers.filter((offer) => offer.categories.includes('top')).slice(0, 3);

    return (
      <>
        <section className="bg-muted/40 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Partner Marketplace</h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">Browse active partner offers, compare value, and review membership tier requirements before redeeming.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg"><Link href="/partner-offers/offers/all">Browse all partner offers</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/membership">Compare membership tiers</Link></Button>
              <Button asChild size="lg" variant="ghost"><Link href="/search?contentType=partner_offer">Search all catalogue items</Link></Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 md:px-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(categories).map(([key, info]) => (
              <Link key={key} href={`/partner-offers/offers/${key}`} className="rounded-lg border bg-card p-4 text-sm hover:border-primary">
                <p className="font-semibold">{info.name}</p>
                <p className="mt-1 text-muted-foreground">{info.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Featured active offers</h2></div>
            {topOffers.length === 0 ? (
              <Alert className="max-w-2xl mx-auto"><AlertTitle>No active offers right now</AlertTitle><AlertDescription>Our team is preparing new partner offers. Please check back soon.</AlertDescription></Alert>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{topOffers.map((offer) => (<OfferCard key={offer.id} offer={offer} />))}</div>
            )}
          </div>
        </section>
      </>
    );
  } catch {
    return <div className="container mx-auto px-4 md:px-6 py-16"><Alert variant="destructive" className="max-w-2xl mx-auto"><AlertTitle>Unable to load partner offers</AlertTitle><AlertDescription>Please try again shortly.</AlertDescription></Alert></div>;
  }
}
