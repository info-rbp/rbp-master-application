'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformSession } from '@/app/providers/platform-session-provider';

export function AuthGuard({ children, moduleKey }: { children: React.ReactNode; moduleKey?: string }) {
  const router = useRouter();
  const { authenticated, loading, hasModule } = usePlatformSession();

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace('/login');
      return;
    }
    if (moduleKey && !hasModule(moduleKey)) {
      router.replace('/access-denied');
    }
  }, [authenticated, hasModule, loading, moduleKey, router]);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading session…</div>;
  }

  if (!authenticated || (moduleKey && !hasModule(moduleKey))) {
    return <div className="p-8 text-sm text-muted-foreground">Checking access…</div>;
  }

  return <>{children}</>;
}
