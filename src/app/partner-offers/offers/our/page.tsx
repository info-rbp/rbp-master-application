import OfferCard from '../../components/offer-card';
import { categories, OfferCategory, toOfferView } from '../../data';
import { getPartnerOffers } from '@/lib/data';

export default async function OffersCategoryPage() {
  const category: OfferCategory = 'our';
  const categoryInfo = categories[category];
  const offers = (await getPartnerOffers()).filter((o) => o.active).map(toOfferView);
  const categoryOffers = offers.filter(o => o.categories.includes(category));

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">{categoryInfo.name}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{categoryInfo.description}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {categoryOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
