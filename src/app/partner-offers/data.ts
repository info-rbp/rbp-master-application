import placeholderImages from '@/lib/placeholder-images.json';

export const categories = {
    top: { name: 'Top Strategic Deals', description: 'Our most valuable offers, curated to give your business a strategic advantage.' },
    new: { name: 'New Offers', description: 'The latest deals and discounts from our growing network of partners.' },
    exclusive: { name: 'Exclusive Deals', description: 'Special offers available only to Remote Business Partner members.' },
    our: { name: 'Our Picks', description: 'Hand-picked deals by our team that we think you\'ll love.' },
    all: { name: 'All Offers', description: 'Browse every offer available from our trusted partners.' },
};

export type OfferCategory = keyof typeof categories;

export type Offer = {
  id: string;
  partner: string;
  logo: { src: string; width: number; height: number; hint: string; };
  title: string;
  description: string;
  categories: OfferCategory[];
  href: string;
};

export const offers: Offer[] = [
    { id: '1', partner: 'CloudMaestro', logo: placeholderImages.partnerLogo1, title: '$10,000 in Cloud Credits', description: 'Supercharge your startup with cloud credits for hosting, databases, and more.', categories: ['top', 'exclusive', 'all'], href: '#' },
    { id: '2', partner: 'LegalWise', logo: placeholderImages.partnerLogo2, title: '50% Off First Year Legal Plan', description: 'Protect your business with affordable legal services, from incorporation to contracts.', categories: ['top', 'all'], href: '#' },
    { id: '3', partner: 'PaySphere', logo: placeholderImages.partnerLogo3, title: 'Zero Fees on First $50k in Payments', description: 'Process payments with ease and save on transaction fees.', categories: ['new', 'all'], href: '#' },
    { id: '4', partner: 'GrowthHackers', logo: placeholderImages.partnerLogo4, title: '6 Months Free of Pro Marketing Suite', description: 'Access powerful tools for email marketing, CRM, and automation.', categories: ['new', 'exclusive', 'all'], href: '#' },
    { id: '5', partner: 'DeskNow', logo: placeholderImages.partnerLogo5, title: '20% Off Coworking Memberships', description: 'Find a flexible workspace anywhere in the world with a discount.', categories: ['our', 'all'], href: '#' },
    { id: '6', partner: 'AcquireWell', logo: placeholderImages.partnerLogo6, title: '$5,000 Credit for M&A Services', description: 'Expert support for your business acquisition or sale.', categories: ['top', 'our', 'all'], href: '#' },
];
