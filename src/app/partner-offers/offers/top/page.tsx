import OfferCard from '../../components/offer-card';
import { categories, OfferCategory, toOfferView } from '../../data';
import { getActivePartnerOffers } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function OffersCategoryPage() {
  const category: OfferCategory = 'top';
  const categoryInfo = categories[category];

  try {
    const activeOffers = await getActivePartnerOffers();
    const offers = activeOffers.map((offer, index) => toOfferView(offer, index, activeOffers.length));
    const categoryOffers = offers.filter((offer) => offer.categories.includes(category));

    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">{categoryInfo.name}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{categoryInfo.description}</p>
        </div>
        {categoryOffers.length === 0 ? (
          <Alert className="max-w-2xl mx-auto"><AlertTitle>No offers found</AlertTitle><AlertDescription>There are currently no active offers in this category.</AlertDescription></Alert>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{categoryOffers.map((offer) => (<OfferCard key={offer.id} offer={offer} />))}</div>
        )}
      </div>
    );
  } catch {
    return <div className="container mx-auto px-4 md:px-6 py-12"><Alert variant="destructive"><AlertTitle>Unable to load offers</AlertTitle><AlertDescription>Please refresh and try again.</AlertDescription></Alert></div>;
  }
}
