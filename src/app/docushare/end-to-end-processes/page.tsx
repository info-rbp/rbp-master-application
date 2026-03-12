import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentSuites, getDocuShareSectionContent } from '@/lib/data';

export default async function DocuShareCategoryPage() {
  const [content, allSuites] = await Promise.all([
    getDocuShareSectionContent('end-to-end-processes'),
    getDocumentSuites(),
  ]);
  const suites = allSuites.filter((suite) => suite.contentType === 'end-to-end-processes');

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{content?.title ?? 'End-to-End Processes'}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">{content?.description ?? 'Comprehensive process playbooks and workflows.'}</p>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">
        {suites.length === 0 ? <Alert><AlertTitle>No published content available</AlertTitle><AlertDescription>Content will appear here when published.</AlertDescription></Alert> : (
          <div className="grid gap-6 md:grid-cols-2">{suites.map((suite) => <Card key={suite.id}><CardHeader><CardTitle><Link className="hover:underline" href={`/docushare/end-to-end-processes/${suite.slug ?? suite.id}`}>{suite.name}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{suite.summary ?? suite.description}</p><p className="text-xs text-muted-foreground mt-2">Resources: {suite.documents.length}</p></CardContent></Card>)}</div>
        )}
      </div></section>
    </div>
  );
}
