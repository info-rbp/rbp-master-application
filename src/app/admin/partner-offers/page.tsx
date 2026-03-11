import { PartnerOffersManager } from '../components/admin-content-managers';
import { getPartnerOffers } from '@/lib/data';

export default async function AdminPartnerOffersPage() {
  const offers = await getPartnerOffers();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Partner Offers</h2>
      <PartnerOffersManager initial={offers} />
    </div>
  );
}
