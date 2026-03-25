
'use client';

import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { useSearchParams } from "next/navigation";
import { offers } from '../data';
import { useAuth } from "@/firebase/provider";
import { getEffectiveMembershipTier, compareMembershipTier } from '@/lib/entitlements';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RedeemOfferPage() {
    const searchParams = useSearchParams();
    const offerId = searchParams.get('offerId');
    const { user } = useAuth();
    const userTier = user ? getEffectiveMembershipTier(user) : 'basic';

    const offer = offers.find(o => o.id === offerId);

    if (!offer) {
        return <div>Offer not found</div>;
    }

    const canRedeem = compareMembershipTier(userTier, offer.entitlement.accessTier) >= 0;

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Redeem Offer</h1>
        <div className="max-w-md mx-auto bg-gray-100 p-8 rounded-lg">
            {canRedeem ? (
                <div>
                    <h2 className="text-2xl font-bold mb-4">{offer.title}</h2>
                    <p className="mb-4">{offer.description}</p>
                    <p className="text-center font-bold">Your redemption code is: {offer.redemptionCode}</p>
                    <div className="text-center mt-4">
                        <Link href={`/out/${offer.slug}`} passHref>
                            <Button>Go to Partner Site</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <p className="text-center">You do not have the required membership tier to redeem this offer.</p>
            )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
