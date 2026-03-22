'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import MarketingHeader from '@/components/marketing-header';
import MarketingFooter from '@/components/marketing-footer';
import { getRouteDefinition } from '@/lib/platform/route-access';

export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routeDefinition = getRouteDefinition(pathname);
  const showMarketingLayout = (routeDefinition?.routeType ?? 'public') === 'public' && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  return (
    <FirebaseClientProvider>
      {showMarketingLayout ? (
        <div className="flex flex-col min-h-screen">
          <MarketingHeader />
          <main className="flex-1">{children}</main>
          <MarketingFooter />
        </div>
      ) : (
        <>{children}</>
      )}
    </FirebaseClientProvider>
  );
}
