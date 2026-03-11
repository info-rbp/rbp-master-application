
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Shield, Gem, HelpCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    name: "Basic Membership",
    price: "Free",
    icon: Star,
    description: "Essential resources to get your business started.",
    href: "/membership/basic",
  },
  {
    name: "Standard Membership",
    price: "$49/mo",
    icon: Shield,
    description: "Advanced tools and content for growing businesses.",
    href: "/membership/standard",
  },
  {
    name: "Premium Membership",
    price: "Custom",
    icon: Gem,
    description: "Bespoke support and expert access for established teams.",
    href: "/membership/premium",
  },
  {
    name: "FAQ",
    price: "",
    icon: HelpCircle,
    description: "Find answers to common questions about our plans.",
    href: "/membership/faq",
  },
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((tier) => (
              <Card key={tier.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <tier.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-center text-2xl">{tier.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow text-center">
                    <p className="text-muted-foreground">{tier.description}</p>
                    {tier.price && <div className="text-3xl font-bold mt-4">{tier.price}</div>}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={tier.name === "Standard Membership" ? "default" : "outline"}>
                    <Link href={tier.href}>
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
         <div className="mt-20 text-center bg-primary/10 p-8 rounded-lg container mx-auto">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Not sure which plan is right for you?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Compare our plans in detail or contact us for a recommendation.
             </p>
             <div className="flex gap-4 justify-center">
                <Button size="lg" className="mt-6" asChild>
                    <Link href="/signup">Sign Up Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="mt-6" asChild>
                    <Link href="/contact">Contact Us</Link>
                </Button>
            </div>
          </div>
      </section>
    </div>
  );
}
