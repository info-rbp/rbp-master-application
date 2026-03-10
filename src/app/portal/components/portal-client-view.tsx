'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import {
  Loader2,
  LogOut,
  Download,
  FileText,
  Link as LinkIcon,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Document, DocumentSuite } from '@/lib/definitions';
import Logo from '@/components/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

export default function PortalClientView({
  documentSuites,
}: {
  documentSuites: DocumentSuite[];
}) {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">Loading portal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
      </header>
      <main className="flex-grow px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {documentSuites.map((suite) => (
              <Card
                key={suite.id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
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
          <p>
            &copy; {new Date().getFullYear()} DocShare Portal. All rights reserved.
          </p>
          <Button variant="link" asChild>
            <Link href="/admin/login">Admin Login</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
