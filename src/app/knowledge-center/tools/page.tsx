import Link from 'next/link';
import { Download } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getKnowledgeArticles } from '@/lib/data';

export default async function ToolsPage() {
  const tools = await getKnowledgeArticles({ type: 'tool', published: true, sortBy: 'publishedAt' });
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Tools & Templates</h1></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {tools.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published tools available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Card key={tool.id} className="flex flex-col"><CardHeader><CardTitle className="text-center text-xl">{tool.title}</CardTitle></CardHeader><CardContent className="flex-grow text-center text-muted-foreground">{tool.excerpt}</CardContent><CardFooter>{tool.externalLink ? <Button asChild className="w-full"><Link href={tool.externalLink}>{tool.ctaLabel || 'Open Tool'} <Download className="ml-2 h-4 w-4" /></Link></Button> : <Button asChild className="w-full"><Link href={`/knowledge-center/tools/${tool.slug}`}>View Tool <Download className="ml-2 h-4 w-4" /></Link></Button>}</CardFooter></Card>)}</div>
      </div></section>
    </div>
  );
}
