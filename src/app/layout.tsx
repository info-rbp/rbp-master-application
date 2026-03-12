import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { RootShell } from '@/components/layout/root-shell';
import { buildSeoMetadata } from '@/lib/seo';

export const metadata: Metadata = buildSeoMetadata({
  title: 'Remote Business Partner',
  description: 'Your strategic partner for business growth and efficiency, providing documents, templates, and resources for startups, entrepreneurs, and small business owners.',
  path: '/',
});

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased', 'bg-background')}>
        <RootShell>{children}</RootShell>
        <Toaster />
      </body>
    </html>
  );
}
