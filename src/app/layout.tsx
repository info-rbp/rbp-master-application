import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { RootShell } from '@/components/layout/root-shell';
import { PlatformSessionProvider } from '@/app/providers/platform-session-provider';

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
      <body className="font-sans">
        <AnalyticsProvider />
        <PlatformSessionProvider>
          <RootShell>{children}</RootShell>
        </PlatformSessionProvider>
      </body>
    </html>
  );
}
