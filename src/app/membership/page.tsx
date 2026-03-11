
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: "Explorer",
    price: "Free",
    priceDetail: "For individuals starting out",
    features: [
      "Access to standard document library",
      "Basic financial templates",
      "Community forum access",
    ],
    cta: "Sign Up for Free",
    href: "/signup"
  },
  {
    name: "Growth",
    price: "$49",
    priceDetail: "per month, billed annually",
    features: [
      "Everything in Explorer, plus:",
      "Access to premium legal templates",
      "Advanced financial models",
      "Monthly expert webinars",
      "Priority support",
    ],
    cta: "Get Started",
    href: "/signup",
    recommended: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceDetail: "For established teams",
    features: [
      "Everything in Growth, plus:",
      "Dedicated account manager",
      "Custom document creation",
      "On-demand advisory calls",
      "Team access and management",
    ],
    cta: "Contact Sales",
    href: "/contact"
  }
];

export default function MembershipPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Membership Plans
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Choose the perfect plan to accelerate your business growth. Unlock exclusive documents, resources, and expert support.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3 max-w-6xl mx-auto items-start">
            {tiers.map((tier) => (
              <Card key={tier.name} className={`flex flex-col ${tier.recommended ? 'border-primary border-2' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.priceDetail}</CardDescription>
                  <div className="text-4xl font-bold pt-4">{tier.price}</div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={tier.recommended ? 'default' : 'outline'}>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
