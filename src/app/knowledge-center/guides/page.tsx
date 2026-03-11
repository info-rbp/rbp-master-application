
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';

const guides = [
  {
    title: "The Ultimate Guide to Fundraising",
    description: "A step-by-step playbook for preparing, launching, and closing your next funding round, complete with checklists and template links.",
    image: placeholderImages.guidesHero,
    href: "#"
  },
  {
    title: "Financial Modeling from Scratch",
    description: "Learn to build a comprehensive three-statement financial model for your business. Perfect for founders and aspiring analysts.",
    image: placeholderImages.articleImage2,
    href: "#"
  },
  {
    title: "Guide to International Expansion",
    description: "A practical guide to taking your business global, covering legal, financial, and operational considerations for market entry.",
    image: placeholderImages.projectImage1,
    href: "#"
  }
];

export default function GuidesPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Guides & Playbooks
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Practical, step-by-step guides and strategic playbooks to navigate complex business challenges.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Card key={guide.title} className="flex flex-col overflow-hidden">
                <Image
                  src={guide.image.src}
                  alt={guide.title}
                  width={guide.image.width}
                  height={guide.image.height}
                  data-ai-hint={guide.image.hint}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <CardTitle className="text-xl">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{guide.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={guide.href}>
                      Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
