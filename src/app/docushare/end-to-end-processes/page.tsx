
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Check, Workflow } from 'lucide-react';

const heroImage = placeholderImages.docushareProcesses;
const pageTitle = "End-to-End Processes";
const pageDescription = "Comprehensive, actionable workflows that map out entire business processes from start to finish, combining documents, guides, and strategic best practices.";

const features = [
  { title: "Strategic Roadmaps", description: "Go beyond documents with strategic playbooks for critical operations like product launches or new market entry." },
  { title: "Integrated Resources", description: "Each process includes all the templates, checklists, and guides you need at every step." },
  { title: "Best Practice Built-In", description: "Leverage our expertise with processes designed for efficiency, compliance, and scalability." },
  { title: "Improve Consistency", description: "Ensure key processes are performed consistently and correctly across your organization every time." },
];

export default function EndToEndProcessesPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center">
            <Workflow className="h-12 w-12 text-primary" />
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">From Strategy to Execution</h2>
                <p className="text-muted-foreground text-lg">Our End-to-End Processes are more than just documentation; they are complete operational playbooks designed to guide your team to success.</p>
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
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Streamline Your Operations?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Explore our customisation services to build a process tailored for your business.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/docushare/customisation-service">Request Customisation</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
