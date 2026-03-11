import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check } from 'lucide-react';

const heroImage = placeholderImages.hrHero; 
const pageTitle = "Human Resources Advisory";
const pageDescription = "Build a thriving team and culture. We provide strategic HR support to help you attract, retain, and develop top talent.";
const services = [
  { title: "Talent Acquisition & Retention Strategies", description: "Develop strategies to attract top candidates, streamline hiring, and create a culture that makes people want to stay." },
  { title: "Performance Management Frameworks", description: "Implement fair and effective performance review systems that motivate employees and align with business goals." },
  { title: "Compensation & Benefits", description: "Design competitive compensation and benefits packages to attract and retain the best talent in your industry." },
  { title: "Employee Relations & Compliance", description: "Navigate complex employee relations issues and ensure compliance with all relevant employment laws and regulations." },
];

export default function HumanResourcesAdvisoryPage() {
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Build Your Dream Team?</h2>
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
