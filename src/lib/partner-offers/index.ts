import { पार्टनरOffers } from './types';

const offers: पार्टनरOffers[] = [
    {
        id: '1',
        name: 'Free Month of Service',
        partner: 'Partner A',
        description: 'Get your first month of service for free when you sign up for a new account.',
        code: 'FREE_MONTH',
        url: 'https://partner-a.com/offer',
    },
    {
        id: '2',
        name: '20% Off Annual Subscription',
        partner: 'Partner B',
        description: 'Get 20% off your annual subscription when you sign up for a new account.',
        code: '20_OFF',
        url: 'https://partner-b.com/offer',
    },
];

export async function getPartnerOffers(): Promise<पार्टनरOffers[]> {
    return offers;
}

export async function getPartnerOffer(id: string): Promise<पार्टनरOffers | undefined> {
    return offers.find((offer) => offer.id === id);
}
