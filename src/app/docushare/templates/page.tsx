import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentSuites } from '@/lib/data';

const pageTitle = 'Business & Legal Templates';
const pageDescription = 'Access a comprehensive library of professionally crafted templates to streamline your operations and ensure compliance.';

export default async function TemplatesPage() {
  const suites = (await getDocumentSuites()).filter((suite) => suite.contentType === 'templates');

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex justify-center"><FileText className="h-12 w-12 text-primary" /></div>
          <h1 className="mt-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">{pageTitle}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">{pageDescription}</p>
        </div>
      </section>

      <section className="py-16 md:py-24"><div className="container mx-auto px-4 md:px-6 space-y-6">
        {suites.length === 0 ? <Alert><AlertTitle>No template suites published</AlertTitle><AlertDescription>Check back soon for template packs and resources.</AlertDescription></Alert> : (
          <div className="grid gap-6 md:grid-cols-2">
            {suites.map((suite) => (
              <Card key={suite.id}><CardHeader><CardTitle>{suite.name}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{suite.description}</p><p className="text-xs text-muted-foreground">Documents: {suite.documents.length}</p></CardContent></Card>
            ))}
          </div>
        )}
        <div className="text-center"><Button asChild><Link href="/portal">Access the Portal</Link></Button></div>
      </div></section>
    </div>
  );
}
