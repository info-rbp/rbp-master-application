import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { requireSessionForPath } from '@/lib/platform/server-guards';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { buildWorkspaceNavigation, buildUserMenuNavigation } from '@/lib/platform/navigation-builder';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const response = await requireSessionForPath('/portal');
  if (!response.authenticated) return null;

  const context = createNavigationContextFromSession(response.session, '/portal');
  const workspaceNav = buildWorkspaceNavigation(context);
  const userNav = buildUserMenuNavigation(context);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="border rounded-lg p-4 h-fit bg-card">
          <h2 className="font-semibold mb-1">Platform Workspace</h2>
          <p className="text-xs text-muted-foreground mb-4">Tenant-aware operations hub</p>
          <nav className="space-y-1">
            {workspaceNav.map((item) => (
              <Button key={item.id} asChild variant="ghost" className="w-full justify-start">
                <Link href={item.route}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Signed in as {response.session.user.email}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Tenant: {response.session.activeTenant.name}</div>
          <div className="mt-3 space-y-1">
            {userNav.map((item) => (
              <Button key={item.id} asChild variant="link" className="px-0 h-auto text-xs">
                <Link href={item.route}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
