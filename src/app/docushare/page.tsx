
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, FolderKanban, Wrench, Workflow, FileText } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';

const categories = [
    {
        title: "Templates",
        description: "Ready-to-use business and legal documents to get you started quickly.",
        href: "/docushare/templates",
        icon: FileText,
        image: placeholderImages.docushareTemplates
    },
    {
        title: "Companion Guides",
        description: "Step-by-step instructions to help you use our templates effectively.",
        href: "/docushare/companion-guides",
        icon: BookOpen,
        image: placeholderImages.docushareGuides
    },
    {
        title: "Documentation Suites",
        description: "Curated bundles of documents for specific business functions.",
        href: "/docushare/documentation-suites",
        icon: FolderKanban,
        image: placeholderImages.docushareSuites
    },
    {
        title: "End-to-End Processes",
        description: "Comprehensive workflows that map out entire business processes.",
        href: "/docushare/end-to-end-processes",
        icon: Workflow,
        image: placeholderImages.docushareProcesses
    },
    {
        title: "Customisation Service",
        description: "Bespoke services to tailor documents and processes to your needs.",
        href: "/docushare/customisation-service",
        icon: Wrench,
        image: placeholderImages.docushareCustomisation
    },
]

export default function DocuShareLandingPage() {
  const { hero } = placeholderImages;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                DocuShare Portal
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Streamline your operations with our comprehensive library of documents, templates, guides, and processes. Focus on your business, we'll handle the paperwork.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/portal">Access the Document Hub</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 text-center">
                 <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Everything You Need, All in One Place.
                  </h2>
                  <p className="max-w-[600px] mx-auto text-muted-foreground md:text-lg/relaxed">
                    From legal templates to financial models, our comprehensive library is designed to support your business at every stage of growth.
                  </p>
                </div>
            </div>
            <div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                     <Card key={category.title} className="flex flex-col group overflow-hidden">
                        <div className="relative h-48 w-full">
                            <Image
                                src={category.image.src}
                                alt={category.title}
                                fill
                                data-ai-hint={category.image.hint}
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <CardHeader className="flex-row items-center gap-4">
                            <category.icon className="h-8 w-8 text-primary flex-shrink-0" />
                            <CardTitle>{category.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription>{category.description}</CardDescription>
                        </CardContent>
                        <CardContent>
                            <Button variant="outline" asChild>
                                <Link href={category.href}>
                                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                     </Card>
                ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Ready to Elevate Your Business?
                </h2>
                <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Sign up today to gain instant access to our complete library of documents and resources.
                </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button asChild size="lg" variant="secondary">
                        <Link href="/signup">Get Started Now</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
