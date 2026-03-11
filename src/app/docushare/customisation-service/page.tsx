
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check, Wrench } from 'lucide-react';

const heroImage = placeholderImages.docushareCustomisation;
const pageTitle = "Customisation Service";
const pageDescription = "Need something more specific? Our experts can tailor documents, templates, and processes to your unique business requirements.";

const features = [
  { title: "Bespoke Document Creation", description: "We'll draft custom legal and business documents from scratch based on your specific situation." },
  { title: "Template Modification", description: "Modify and enhance our existing templates to perfectly fit your company's policies and procedures." },
  { title: "Workflow Integration", description: "We'll help you integrate our documents and processes directly into your existing software and workflows." },
  { title: "Expert Consultation", description: "Get one-on-one time with our legal and operational experts to ensure your documentation is robust and compliant." },
];

export default function CustomisationServicePage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center">
            <Wrench className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tailored for Your Success</h2>
                <p className="text-muted-foreground text-lg">When off-the-shelf solutions aren't enough, our customisation service provides the bespoke support you need to solve your unique challenges.</p>
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
                Let's have a conversation about your specific needs.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/contact">Book a Consultation</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
