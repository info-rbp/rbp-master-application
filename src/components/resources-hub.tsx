'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

// Resources Hub Hero
export const ResourcesHero = () => (
  <section className="bg-muted/40 py-20 md:py-32">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">Resources</h1>
      <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">Your center for insights, strategies, and tools to accelerate your business growth.</p>
    </div>
  </section>
);

// Featured Resource Block
export const FeaturedResource = ({ resource }) => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Insight</h2>
      <div className="grid md:grid-cols-2 gap-12 items-center bg-card p-8 rounded-lg">
        <div className="aspect-video bg-slate-200 rounded-lg" /> {/* Placeholder for image */}
        <div>
          <h3 className="text-2xl font-bold">{resource.title}</h3>
          <p className="text-muted-foreground mt-4">{resource.summary}</p>
          <Button asChild className="mt-6">
            <Link href={`/resources/articles/${resource.slug}`}>Read More <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

// Category Links
export const CategoryNav = ({ categories }) => (
  <div className="container mx-auto px-4 md:px-6 mb-12">
    <div className="flex justify-center gap-4 flex-wrap">
      {categories.map((cat) => (
        <Button key={cat.id} asChild variant="outline">
          <Link href={`/resources/categories/${cat.slug}`}>{cat.name}</Link>
        </Button>
      ))}
    </div>
  </div>
);

// Article Card
export const ArticleCard = ({ article }) => (
  <Card className="flex flex-col">
    <div className="aspect-video bg-slate-200 rounded-t-lg" /> {/* Placeholder for image */}
    <CardHeader>
      <CardTitle>{article.title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-muted-foreground">{article.summary}</p>
    </CardContent>
    <div className="p-6 pt-0">
      <Button asChild variant="secondary">
        <Link href={`/resources/articles/${article.slug}`}>Read More</Link>
      </Button>
    </div>
  </Card>
);

// In-Article CTA Block
export const InArticleCta = () => (
  <div className="bg-primary text-primary-foreground p-8 rounded-lg my-12 text-center">
    <h3 className="text-2xl font-bold">Ready to take the next step?</h3>
    <p className="mt-2 max-w-2xl mx-auto">Explore our services or book a discovery call to see how we can help your business grow.</p>
    <div className="mt-6 flex gap-4 justify-center">
      <Button asChild variant="secondary">
        <Link href="/services">Explore Services</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/contact">Contact Us</Link>
      </Button>
    </div>
  </div>
);
