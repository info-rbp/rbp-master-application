import Link from 'next/link';
import { ReactNode } from 'react';
import { requireMemberAuth } from './_lib/member-auth';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/membership', label: 'Membership' },
  { href: '/portal/subscription', label: 'Subscription' },
  { href: '/portal/customisation-requests', label: 'Customisation Requests' },
  { href: '/portal/support', label: 'Support Requests' },
  { href: '/portal/discovery-calls', label: 'Discovery Calls' },
  { href: '/portal/saved', label: 'Saved & Recent' },
];

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const auth = await requireMemberAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="border rounded-lg p-4 h-fit bg-card">
          <h2 className="font-semibold mb-1">Member Dashboard</h2>
          <p className="text-xs text-muted-foreground mb-4">Account and operations hub</p>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Button key={item.href} asChild variant="ghost" className="w-full justify-start">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Signed in as {auth.email}
          </div>
          <Button asChild variant="link" className="px-0 mt-2">
            <Link href="/account">Edit profile</Link>
          </Button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
