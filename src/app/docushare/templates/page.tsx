
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check, FileText } from 'lucide-react';

const heroImage = placeholderImages.docushareTemplates;
const pageTitle = "Business & Legal Templates";
const pageDescription = "Access a comprehensive library of professionally crafted, lawyer-vetted templates to streamline your operations and ensure compliance.";

const features = [
  { title: "Save Time & Legal Fees", description: "Start with a solid foundation instead of a blank page. Our templates are crafted by experts." },
  { title: "Easy to Customize", description: "Provided in standard formats, our templates are easy to edit and tailor to your specific business needs." },
  { title: "Wide Range of Documents", description: "Covering everything from employment contracts and NDAs to service agreements and privacy policies." },
  { title: "Regularly Updated", description: "We keep our templates current with the latest legal standards and business best practices." },
];

export default function TemplatesPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center">
            <FileText className="h-12 w-12 text-primary" />
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">The Foundation of Your Business</h2>
                <p className="text-muted-foreground text-lg">Build your company on solid ground with our extensive library of essential documents. Reduce risk, save time, and operate with confidence.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Access the Library?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Log in to the portal to browse and download all available templates.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/portal">Access the Portal</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
