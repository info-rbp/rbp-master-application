import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const response = await requireSessionForPath('/portal');
  if (!response.authenticated) return null;

  const nav = response.session.navigation.filter((item) => item.route.startsWith('/portal') || item.route.startsWith('/settings') || item.route.startsWith('/dashboard'));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="border rounded-lg p-4 h-fit bg-card">
          <h2 className="font-semibold mb-1">Platform Workspace</h2>
          <p className="text-xs text-muted-foreground mb-4">Tenant-aware operations hub</p>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Button key={item.id} asChild variant="ghost" className="w-full justify-start">
                <Link href={item.route}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Signed in as {response.session.user.email}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Tenant: {response.session.activeTenant.name}</div>
          <Button asChild variant="link" className="px-0 mt-2">
            <Link href="/settings/profile">Edit profile</Link>
          </Button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
