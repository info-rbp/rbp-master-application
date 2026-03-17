
'use client';

import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/firebase/provider";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { offers } from './data';
import { getEffectiveMembershipTier } from '@/lib/entitlements';
import { compareMembershipTier } from '@/lib/entitlements';

export default function PartnerOffersPage() {
  const { user } = useAuth();
  const userTier = user ? getEffectiveMembershipTier(user) : 'basic';

  const handleSave = async (offer: any) => {
    if (user) {
      await addDoc(collection(db, 'saved_content'), {
        userId: user.uid,
        savedAt: serverTimestamp(),
        type: 'partner_offer',
        content: offer,
      });
      alert('Offer saved!');
    }
  };

  const filteredOffers = offers.filter(offer => {
    return compareMembershipTier(userTier, offer.entitlement.accessTier) >= 0;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Partner Offers</h1>
        <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
                {filteredOffers.map((offer) => (
                    <li key={offer.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold">{offer.title}</h2>
                            <p>{offer.description}</p>
                        </div>
                        <div>
                            <Link href={`/partner-offers/redeem?offerId=${offer.id}`} passHref>
                                <Button>Redeem</Button>
                            </Link>
                            <Button variant="outline" className="ml-2" onClick={() => handleSave(offer)}>Save for Later</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
