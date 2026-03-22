import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { RootShell } from '@/components/layout/root-shell';
import { PlatformSessionProvider } from '@/app/providers/platform-session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Remote Business Partner',
  description: 'Unified business platform for Remote Business Partner.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider />
        <PlatformSessionProvider>
          <RootShell>{children}</RootShell>
        </PlatformSessionProvider>
      </body>
    </html>
  );
}
