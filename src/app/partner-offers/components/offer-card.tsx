import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Offer } from '../data';

export default function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{offer.partner}</CardTitle>
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
