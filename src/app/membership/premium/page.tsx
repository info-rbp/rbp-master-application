
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check } from 'lucide-react';

const heroImage = placeholderImages.premiumMembership;
const pageTitle = "Premium Membership";
const pageDescription = "Designed for established businesses and enterprises requiring dedicated, bespoke support.";

const features = [
  { title: "Everything in Standard", description: "Includes all features from the Basic and Standard membership tiers." },
  { title: "Dedicated Account Manager", description: "A single point of contact to manage your requests and ensure you get the most value from your membership." },
  { title: "Custom Document Creation", description: "Our experts will draft bespoke legal and business documents tailored to your specific needs." },
  { title: "On-Demand Advisory Calls", description: "Schedule one-on-one video calls with our senior advisors for strategic guidance on finance, operations, and more." },
  { title: "Team Access", description: "Provide access for up to 10 users from your organization, with centralized billing and management." },
];

export default function PremiumMembershipPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            {pageTitle}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
            {pageDescription}
          </p>
           <div className="mt-8">
            <h2 className="text-5xl font-bold">Custom Pricing</h2>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
             <div className="flex flex-col gap-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">White-Glove Service</h2>
                <p className="text-muted-foreground text-lg">The Premium tier provides a fully integrated partnership, with our team acting as an extension of yours.</p>
                {features.map(service => (
                    <div key={service.title} className="flex gap-4">
                        <Check className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-xl font-bold">{service.title}</h3>
                            <p className="text-muted-foreground mt-1">{service.description}</p>
                        </div>
                    </div>
                ))}
             </div>
             <div className="relative h-full min-h-[400px]">
                <Image
                    src={heroImage.src}
                    alt={pageTitle}
                    width={heroImage.width}
                    height={heroImage.height}
                    data-ai-hint={heroImage.hint}
                    className="object-cover rounded-lg"
                />
             </div>
          </div>

          <div className="mt-20 text-center bg-primary/10 p-8 rounded-lg">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Discuss Your Requirements</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Contact our sales team to discuss a custom Premium package that fits your business needs.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/contact">Contact Sales</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
