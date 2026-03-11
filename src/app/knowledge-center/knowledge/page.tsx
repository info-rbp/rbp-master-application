import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getKnowledgeArticles } from '@/lib/data';

export default async function KnowledgeBasePage() {
  const entries = await getKnowledgeArticles({ type: 'knowledge_base', published: true, sortBy: 'publishedAt' });

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Knowledge Base</h1><div className="mt-8 max-w-2xl mx-auto"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="search" placeholder="Search in admin-managed knowledge base..." className="w-full pl-10" disabled /></div></div></div></section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Knowledge Base Entries</h2>
        {entries.length === 0 ? <div className="rounded-lg border p-10 text-center text-muted-foreground">No published entries available yet.</div> : <Accordion type="single" collapsible className="w-full">{entries.map((item) => <AccordionItem key={item.id} value={item.id}><AccordionTrigger className="text-lg font-semibold text-left">{item.title}</AccordionTrigger><AccordionContent className="text-muted-foreground text-base">{item.content}</AccordionContent></AccordionItem>)}</Accordion>}
      </div></section>
    </div>
  );
}
