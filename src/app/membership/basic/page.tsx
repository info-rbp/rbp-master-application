
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check } from 'lucide-react';

const heroImage = placeholderImages.basicMembership;
const pageTitle = "Basic Membership";
const pageDescription = "Ideal for individuals and early-stage startups looking for essential resources to get started.";

const features = [
  { title: "Standard Document Library", description: "Access our core collection of business and legal templates, including NDAs, employment contracts, and more." },
  { title: "Basic Financial Templates", description: "Download simple financial templates for budgeting and cash flow forecasting." },
  { title: "Community Forum Access", description: "Join our community forum to ask questions and connect with other entrepreneurs." },
  { title: "Weekly Newsletter", description: "Receive a weekly roundup of our latest articles, guides, and business insights." },
];

export default function BasicMembershipPage() {
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
            <h2 className="text-5xl font-bold">$0<span className="text-lg font-normal text-muted-foreground">/Free Forever</span></h2>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
             <div className="flex flex-col gap-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Core Features</h2>
                <p className="text-muted-foreground text-lg">Everything you need to build a solid foundation for your business, completely free.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Get Started?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Sign up for a free Basic Membership today and get instant access to our core resources.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/signup">Sign Up for Free</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
