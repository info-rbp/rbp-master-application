
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, BookOpen, Wrench, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const categories = [
    {
        title: "Articles",
        description: "In-depth articles and analysis on strategy, finance, and operations to help you grow your business.",
        href: "/knowledge-center/articles",
        icon: BookOpen
    },
    {
        title: "Guides & Playbooks",
        description: "Practical, step-by-step guides and strategic playbooks to navigate complex business challenges.",
        href: "/knowledge-center/guides",
        icon: GraduationCap
    },
    {
        title: "Tools & Templates",
        description: "Downloadable financial models, report templates, and other tools to streamline your workflow.",
        href: "/knowledge-center/tools",
        icon: Wrench
    },
    {
        title: "Knowledge Base",
        description: "Your searchable repository of business definitions, concepts, and frequently asked questions.",
        href: "/knowledge-center/knowledge",
        icon: Search
    }
]

export default function KnowledgeCenterPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Knowledge Center
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Your hub for expert insights, guides, and resources to help you build and scale your business.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.title} className="flex flex-col group">
                <CardHeader className="flex-row items-center gap-4">
                    <category.icon className="h-8 w-8 text-primary flex-shrink-0" />
                    <CardTitle className="text-2xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription>{category.description}</CardDescription>
                </CardContent>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link href={category.href}>
                            Explore {category.title} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
