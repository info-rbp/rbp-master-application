'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import Logo from './logo';
import { usePlatformSession } from '@/app/providers/platform-session-provider';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { buildPublicNavigation, buildUserMenuNavigation } from '@/lib/platform/navigation-builder';
import { cn } from '@/lib/utils';

const NavLink = ({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) => (
  <Link href={href} className={cn('text-base font-medium transition-colors hover:text-primary', active ? 'text-primary' : 'text-foreground')}>
    {children}
  </Link>
);

export const MarketingHeader = () => {
  const pathname = usePathname();
  const { session, loading } = usePlatformSession();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const context = React.useMemo(() => createNavigationContextFromSession(session, pathname), [session, pathname]);
  const publicNavigation = React.useMemo(() => buildPublicNavigation(context).filter((item) => !item.route.startsWith('/support')), [context]);
  const userNavigation = React.useMemo(() => buildUserMenuNavigation(context), [context]);
  const dashboardHref = session ? (userNavigation[0]?.route ?? '/dashboard') : '/login';

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', isScrolled ? 'h-16' : 'h-20')}>
      <div className="container flex h-full items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
            <span className="hidden font-bold sm:inline-block">Remote Business Partner</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {publicNavigation.map((item) => (
              <NavLink key={item.id} href={item.route} active={pathname.startsWith(item.route) && item.route !== '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none" />
          <nav className="hidden md:flex items-center gap-2">
            <Button asChild variant="secondary" size="medium">
              <Link href="/advisory-booking">Book Discovery Call</Link>
            </Button>
            <Button asChild variant="ghost" size="medium">
              <Link href={dashboardHref}>{loading ? 'Loading…' : session ? 'Open Workspace' : 'Sign in'}</Link>
            </Button>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
              <span className="font-bold">Remote Business Partner</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-4">
                {publicNavigation.map((item) => (
                  <NavLink key={item.id} href={item.route}>{item.label}</NavLink>
                ))}
                <NavLink href={dashboardHref}>{session ? 'Open Workspace' : 'Sign in'}</NavLink>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MarketingHeader;
