
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check } from 'lucide-react';

const heroImage = placeholderImages.standardMembership;
const pageTitle = "Standard Membership";
const pageDescription = "The perfect plan for growing businesses that need access to advanced resources and expert insights.";

const features = [
  { title: "Everything in Basic", description: "Includes all features from the free Basic membership tier." },
  { title: "Premium Document Library", description: "Access our complete library of advanced legal templates, including term sheets, equity agreements, and M&A documents." },
  { title: "Advanced Financial Models", description: "Unlock sophisticated financial models for SaaS metrics, fundraising, and detailed forecasting." },
  { title: "Monthly Expert Webinars", description: "Join live monthly webinars with our senior advisors on topics like capital raising, go-to-market strategy, and operational scaling." },
  { title: "Priority Support", description: "Get your questions answered faster with priority email support from our team." },
];

export default function StandardMembershipPage() {
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
            <h2 className="text-5xl font-bold">$49<span className="text-lg font-normal text-muted-foreground">/month</span></h2>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
             <div className="flex flex-col gap-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Accelerate Your Growth</h2>
                <p className="text-muted-foreground text-lg">Gain a competitive edge with premium resources and direct access to expert knowledge.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Upgrade?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Get immediate access to all Standard features by signing up today.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/signup">Get Started</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
