import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check } from 'lucide-react';

const heroImage = placeholderImages.salesMarketingHero; 
const pageTitle = "Sales & Marketing Advisory";
const pageDescription = "Accelerate your revenue growth. We help you build effective go-to-market strategies, optimize your sales funnel, and create marketing campaigns that deliver results.";
const services = [
  { title: "Go-to-Market Strategy", description: "Develop a comprehensive plan to launch your product or enter new markets, covering everything from pricing to distribution." },
  { title: "Sales Process Optimisation", description: "Fine-tune your sales process to shorten sales cycles, improve conversion rates, and increase revenue." },
  { title: "Digital Marketing Strategy", description: "Create a data-driven digital marketing strategy that builds brand awareness and generates qualified leads." },
  { title: "Content & Brand Strategy", description: "Develop a compelling brand story and content strategy that resonates with your target audience and builds lasting loyalty." },
];

export default function SalesMarketingAdvisoryPage() {
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
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
             <div className="flex flex-col gap-8">
                {services.map(service => (
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Accelerate Your Growth?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Let's discuss how we can tailor our expertise to your specific needs.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/contact">Book a Free Consultation</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
