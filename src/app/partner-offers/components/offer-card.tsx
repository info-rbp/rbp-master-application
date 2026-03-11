import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Offer } from '../data';

export default function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-24 h-12 relative">
             <Image 
                src={offer.logo.src}
                alt={`${offer.partner} logo`}
                fill
                data-ai-hint={offer.logo.hint}
                className="object-contain"
              />
          </div>
          <CardTitle className="text-lg font-bold">{offer.partner}</CardTitle>
        </div>
        <h3 className="text-xl font-semibold text-primary">{offer.title}</h3>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{offer.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={offer.href}>Claim Offer</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
