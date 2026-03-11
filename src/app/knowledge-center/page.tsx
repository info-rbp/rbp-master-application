
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Badge } from '@/components/ui/badge';

const articles = [
  {
    title: "10 Essential Legal Documents for Every Startup",
    description: "Navigate the legal landscape with confidence. This guide covers the top 10 legal documents your new business needs to have in place from day one.",
    image: placeholderImages.articleImage1,
    category: "Legal",
    href: "#"
  },
  {
    title: "Mastering Your Startup's Finances: A Guide to Financial Modeling",
    description: "Unlock the power of financial forecasting. Learn how to build a robust financial model to impress investors and steer your business.",
    image: placeholderImages.articleImage2,
    category: "Finance",
    href: "#"
  },
  {
    title: "How to Build a High-Performing Remote Team",
    description: "The future of work is remote. Discover best practices for hiring, managing, and motivating a distributed team for maximum productivity.",
    image: placeholderImages.articleImage3,
    category: "Operations",
    href: "#"
  }
];

export default function KnowledgeCenterPage() {
  const { knowledgeCenterHero } = placeholderImages;

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
          <div className="mt-8 max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles, guides, and more..."
                className="w-full pl-10"
              />
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.title} className="flex flex-col overflow-hidden">
                <Image
                  src={article.image.src}
                  alt={article.title}
                  width={article.image.width}
                  height={article.image.height}
                  data-ai-hint={article.image.hint}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{article.category}</Badge>
                  <CardTitle className="mt-2 text-xl">{article.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{article.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={article.href}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
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
