
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check, FolderKanban } from 'lucide-react';

const heroImage = placeholderImages.docushareSuites;
const pageTitle = "Documentation Suites";
const pageDescription = "Curated collections of documents, templates, and guides bundled together for specific business functions and scenarios.";

const features = [
  { title: "Function-Specific Bundles", description: "Get all the documents you need for a specific area, like a 'New Hire Suite' with contracts, policies, and checklists." },
  { title: "Goal-Oriented Collections", description: "Access suites designed for major business milestones, such as a 'Fundraising Suite' with pitch decks and financial models." },
  { title: "Guaranteed Compatibility", description: "All documents within a suite are designed to work together seamlessly, ensuring consistency." },
  { title: "Save Time & Effort", description: "Stop searching for individual documents. Our suites provide a comprehensive, one-stop solution." },
];

export default function DocumentationSuitesPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center">
            <FolderKanban className="h-12 w-12 text-primary" />
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">All-in-One Document Kits</h2>
                <p className="text-muted-foreground text-lg">Our Documentation Suites are thoughtfully assembled to provide everything you need for common business challenges, saving you time and ensuring you don't miss a thing.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Get Organized?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Log in to the portal to view and download our available Documentation Suites.
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
