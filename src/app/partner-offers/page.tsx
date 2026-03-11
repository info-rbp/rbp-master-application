import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Search, Gift, Info } from 'lucide-react';
import Link from 'next/link';
import OfferCard from './components/offer-card';
import { toOfferView } from './data';
import { getActivePartnerOffers } from '@/lib/data';

export default async function PartnerOffersPage() {
  try {
    const activeOffers = await getActivePartnerOffers();
    const offers = activeOffers.map((offer, index) => toOfferView(offer, index, activeOffers.length));
    const topOffers = offers.slice(0, 3);

    return (
      <>
        <section className="bg-muted/40 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Exclusive Partner Offers</h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">Unlock hundreds of thousands of dollars in savings on software and tools to grow your business.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg"><Link href="/partner-offers/offers/all">Explore All Deals</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/signup">Become a Member</Link></Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6"><div className="text-center mb-12"><h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2><p className="mt-4 max-w-2xl mx-auto text-muted-foreground">It's as easy as 1, 2, 3 to start saving.</p></div><div className="grid gap-8 md:grid-cols-3 text-center"><div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4"><Search className="h-8 w-8" /></div><h3 className="text-xl font-semibold mb-2">1. Find Your Deal</h3><p className="text-muted-foreground">Browse our curated directory of offers from leading SaaS companies.</p></div><div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4"><CheckCircle className="h-8 w-8" /></div><h3 className="text-xl font-semibold mb-2">2. Become a Member</h3><p className="text-muted-foreground">Sign up for a Remote Business Partner account to get access.</p></div><div className="flex flex-col items-center"><div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4"><Gift className="h-8 w-8" /></div><h3 className="text-xl font-semibold mb-2">3. Redeem & Save</h3><p className="text-muted-foreground">Follow the simple instructions to claim your discount and start saving money.</p></div></div></div></section>

        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12"><h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Top Strategic Deals</h2><p className="mt-4 max-w-2xl mx-auto text-muted-foreground">Our most popular and valuable offers to give you a competitive edge.</p></div>
            {topOffers.length === 0 ? (
              <Alert className="max-w-2xl mx-auto"><Info className="h-4 w-4" /><AlertTitle>No active offers right now</AlertTitle><AlertDescription>Our team is preparing new partner offers. Please check back soon.</AlertDescription></Alert>
            ) : (
              <><div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{topOffers.map((offer) => (<OfferCard key={offer.id} offer={offer} />))}</div><div className="text-center mt-12"><Button asChild><Link href="/partner-offers/offers/top">View All Top Deals</Link></Button></div></>
            )}
          </div>
        </section>
      </>
    );
  } catch {
    return <div className="container mx-auto px-4 md:px-6 py-16"><Alert variant="destructive" className="max-w-2xl mx-auto"><AlertTitle>Unable to load partner offers</AlertTitle><AlertDescription>Please try again shortly.</AlertDescription></Alert></div>;
  }
}
