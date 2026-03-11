import { Folder } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentSuites } from '@/lib/data';

export default async function DocumentationSuitesPage() {
  const suites = (await getDocumentSuites()).filter((suite) => suite.contentType === 'documentation-suites');

  return <div><section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40"><div className="container mx-auto px-4 md:px-6 text-center"><div className="flex justify-center"><Folder className="h-12 w-12 text-primary" /></div><h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Documentation Suites</h1></div></section><section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6">{suites.length===0 ? <Alert><AlertTitle>No documentation suites available</AlertTitle><AlertDescription>Suites will appear here when published.</AlertDescription></Alert> : <div className="grid gap-6 md:grid-cols-2">{suites.map((suite)=><Card key={suite.id}><CardHeader><CardTitle>{suite.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{suite.description}</p><p className="mt-2 text-xs text-muted-foreground">Resources: {suite.documents.length}</p></CardContent></Card>)}</div>}</div></section></div>;
}
