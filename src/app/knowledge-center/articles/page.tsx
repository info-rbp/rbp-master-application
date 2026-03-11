import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getKnowledgeArticles } from '@/lib/data';

export default async function ArticlesPage() {
  const articles = await getKnowledgeArticles({ type: 'article', published: true, sortBy: 'publishedAt' });

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Articles</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">In-depth articles and analysis on strategy, finance, and operations.</p>
          <div className="mt-8 max-w-lg mx-auto"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search articles in admin" className="w-full pl-10" disabled /></div></div>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {articles.length === 0 && <div className="rounded-lg border p-10 text-center text-muted-foreground">No published articles available yet.</div>}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col">
              <CardHeader>
                <div className="flex gap-2">{article.featured && <Badge>Featured</Badge>}</div>
                <CardTitle className="mt-2 text-xl">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow text-muted-foreground">{article.excerpt || 'Read this article for practical insights.'}</CardContent>
              <CardFooter><Button variant="link" asChild className="p-0 h-auto"><Link href={`/knowledge-center/articles/${article.slug}`}>Read More <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
            </Card>
          ))}
        </div></div>
      </section>
    </div>
  );
}
