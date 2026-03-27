'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User } from 'lucide-react';
import Logo from './logo';
import { cn } from '@/lib/utils';

const publicNavigation = [
  { id: 'home', label: 'Home', route: '/' },
  { id: 'about', label: 'About', route: '/about' },
  { id: 'services', label: 'Services', route: '/services' },
  { id: 'docushare', label: 'DocuShare', route: '/docushare' },
  { id: 'offers', label: 'Offers', route: '/offers' },
  { id: 'applications', label: 'Applications', route: '/applications' },
  { id: 'resources', label: 'Resources', route: '/resources' },
  { id: 'contact', label: 'Contact', route: '/contact' },
];

const NavLink = ({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) => (
  <Link href={href} className={cn('text-base font-medium transition-colors hover:text-primary', active ? 'text-primary' : 'text-foreground')}>
    {children}
  </Link>
);

export const MarketingHeader = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', isScrolled ? 'h-16' : 'h-20')}>
      <div className="container flex h-full items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
            <span className="hidden font-bold sm:inline-block">Remote Business Partner</span>
          </Link>
          <nav className="flex items-center space-x-4 text-sm font-medium">
            {publicNavigation.map((item) => (
              <NavLink key={item.id} href={item.route} active={pathname === item.route}>
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
            <Button asChild variant="ghost" size="icon">
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">Sign in</span>
              </Link>
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
                 <Button asChild variant="link" className="justify-start">
                    <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MarketingHeader;
