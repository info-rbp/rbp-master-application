import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';

const offers = [
  {
    partner: "CloudCorp",
    logo: placeholderImages.partnerLogo1,
    offer: "$10,000 in Cloud Credits",
    description: "Get a head start on your infrastructure with $10,000 in free credits for cloud hosting, databases, and more. Ideal for startups and growing businesses."
  },
  {
    partner: "LegalEase",
    logo: placeholderImages.partnerLogo2,
    offer: "50% Off First Year Legal Plan",
    description: "Protect your business with affordable legal services. Get 50% off your first year on incorporation, contracts, and compliance packages."
  },
  {
    partner: "FinPal",
    logo: placeholderImages.partnerLogo3,
    offer: "Zero Fees on First $50k in Payments",
    description: "Process payments with ease. Our members get zero transaction fees on their first $50,000 processed through the FinPal platform."
  },
  {
    partner: "Marketo",
    logo: placeholderImages.partnerLogo4,
    offer: "6 Months Free of Pro Marketing Suite",
    description: "Supercharge your marketing efforts. Access powerful tools for email marketing, CRM, and automation, free for the first six months."
  }
];

export default function PartnerOffersPage() {
  const { offersHero } = placeholderImages;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Exclusive Partner Offers
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            As a member of Remote Business Partner, you get access to exclusive discounts and credits from our network of trusted partners.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {offers.map((offer) => (
              <Card key={offer.partner} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <Image 
                      src={offer.logo.src}
                      alt={`${offer.partner} logo`}
                      width={100}
                      height={50}
                      data-ai-hint={offer.logo.hint}
                      className="object-contain"
                    />
                     <CardTitle className="text-xl font-bold">{offer.partner}</CardTitle>
                  </div>
                  <h3 className="text-2xl font-semibold text-primary">{offer.offer}</h3>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{offer.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                    <Link href="#">Claim Offer</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
