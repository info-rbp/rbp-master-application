'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import MarketingHeader from '@/components/marketing-header';
import MarketingFooter from '@/components/marketing-footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Remote Business Partner</title>
        <meta name="description" content="Your strategic partner for business growth and efficiency, providing documents, templates, and resources for startups, entrepreneurs, and small business owners." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        <FirebaseClientProvider>
            <div className="flex flex-col min-h-screen">
              <MarketingHeader />
              <main className="flex-1">
                {children}
              </main>
              <MarketingFooter />
            </div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
