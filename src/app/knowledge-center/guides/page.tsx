import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getKnowledgeArticles } from '@/lib/data';

export default async function GuidesPage() {
  const guides = await getKnowledgeArticles({ type: 'guide', published: true, sortBy: 'publishedAt' });

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Guides & Playbooks</h1></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {guides.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published guides available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <Card key={guide.id} className="flex flex-col"><CardHeader>{guide.featured && <Badge className="w-fit">Featured</Badge>}<CardTitle className="text-xl">{guide.title}</CardTitle></CardHeader><CardContent className="flex-grow text-muted-foreground">{guide.excerpt}</CardContent><CardFooter><Button variant="outline" asChild className="w-full"><Link href={`/knowledge-center/guides/${guide.slug}`}>Read Guide <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter></Card>)}</div>
      </div></section>
    </div>
  );
}
