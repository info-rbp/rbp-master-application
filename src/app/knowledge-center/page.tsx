import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getKnowledgeLandingContent } from '@/lib/data';

const fallbackCategories = [
  { title: 'Articles', description: 'In-depth articles and analysis.', href: '/knowledge-center/articles' },
  { title: 'Guides & Playbooks', description: 'Practical, step-by-step business guides.', href: '/knowledge-center/guides' },
  { title: 'Tools & Templates', description: 'Downloadable templates and practical tools.', href: '/knowledge-center/tools' },
  { title: 'Knowledge Base', description: 'Searchable definitions and FAQ content.', href: '/knowledge-center/knowledge' },
];

export default async function KnowledgeCenterPage() {
  const content = await getKnowledgeLandingContent();
  const categories = content?.sections?.[0]?.items?.length ? content.sections[0].items : fallbackCategories;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{content?.title ?? 'Knowledge Center'}</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Your hub for expert insights, guides, and resources.'}</p>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6"><div className="grid gap-8 md:grid-cols-2">{categories.map((category) => <Card key={category.title} className="flex flex-col"><CardHeader><CardTitle className="text-2xl">{category.title}</CardTitle></CardHeader><CardContent className="flex-grow"><CardDescription>{category.description}</CardDescription></CardContent><CardContent><Button variant="outline" asChild><Link href={category.href ?? '/knowledge-center'}>Explore {category.title} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card>)}</div></div></section>
    </div>
  );
}
