import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Link as LinkIcon,
  Folder,
} from 'lucide-react';
import { getDocumentSuites } from '@/lib/data';
import type { Document } from '@/lib/definitions';
import Logo from '@/components/logo';

function DocumentItem({ document }: { document: Document }) {
  const Icon = document.type === 'drive' ? LinkIcon : FileText;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-secondary/50">
      <div className="flex items-center gap-4">
        <Icon className="h-6 w-6 text-primary" />
        <div className="flex flex-col">
          <span className="font-medium text-card-foreground">
            {document.name}
          </span>
          <p className="text-sm text-muted-foreground">
            {document.description}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" asChild>
        <a href={document.url} target="_blank" rel="noopener noreferrer">
          <Download className="h-5 w-5" />
          <span className="sr-only">Download</span>
        </a>
      </Button>
    </div>
  );
}

export default async function Home() {
  const documentSuites = await getDocumentSuites();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-3xl font-bold font-headline" style={{ color: 'hsl(274, 49%, 30%)' }}>
              DocShare Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Your central hub for all documentation and templates.
            </p>
          </div>
        </div>
      </header>
      <main className="flex-grow px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {documentSuites.map((suite) => (
              <Card key={suite.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-card flex flex-row items-center gap-4 p-4 border-b">
                  <Folder className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{suite.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {suite.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="divide-y divide-border">
                    {suite.documents.map((doc) => (
                      <DocumentItem key={doc.id} document={doc} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <footer className="w-full py-6 mt-16 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DocShare Portal. All rights reserved.</p>
          <Button variant="link" asChild>
            <Link href="/login">Admin Login</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
