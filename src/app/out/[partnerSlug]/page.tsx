
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { offers } from '@/app/partner-offers/data';
import { useAuth } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';

export default function PartnerRedirectPage({ params }: { params: { partnerSlug: string } }) {
  const { user } = useAuth();

  useEffect(() => {
    const offer = offers.find(o => o.slug === params.partnerSlug);

    if (offer) {
      if (user) {
        addDoc(collection(db, 'partner_clicks'), {
          userId: user.uid,
          offerId: offer.id,
          clickedAt: serverTimestamp(),
        });
      }
      redirect(offer.link);
    } else {
      redirect('/');
    }
  }, [params.partnerSlug, user]);

  return (
    <div>
      <p>Redirecting...</p>
    </div>
  );
}
