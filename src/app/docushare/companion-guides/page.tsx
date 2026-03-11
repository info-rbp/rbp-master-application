
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check, BookOpen } from 'lucide-react';

const heroImage = placeholderImages.docushareGuides;
const pageTitle = "Companion Guides";
const pageDescription = "Practical, step-by-step guides that provide context and instructions for using our templates effectively, helping you understand the 'why' behind the paperwork.";

const features = [
  { title: "Clarify Complexity", description: "Our guides break down complex legal and business concepts into easy-to-understand language." },
  { title: "Ensure Correct Usage", description: "Follow best practices for filling out and implementing each document to avoid common pitfalls." },
  { title: "Provide Strategic Context", description: "Understand how each document fits into your broader business strategy and operational workflows." },
  { title: "Actionable Checklists", description: "Get actionable checklists to ensure you've completed all necessary steps for a given process, like employee onboarding." },
];

export default function CompanionGuidesPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-primary" />
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Go Beyond the Template</h2>
                <p className="text-muted-foreground text-lg">A template is a tool, but a guide is your instruction manual. Our companion guides empower you to use our resources with confidence and precision.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Deepen Your Understanding?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Explore our Documentation Suites to see how guides and templates work together.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/docushare/documentation-suites">Explore Suites</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
