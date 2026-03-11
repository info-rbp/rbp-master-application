'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { categories as partnerCategories } from '@/app/partner-offers/data';

const navLinks = [
   {
    label: 'Services',
    href: '/services',
    subLinks: [
      { href: '/services', label: 'All Services' },
      { href: '/services/operations', label: 'Operations Advisory' },
      { href: '/services/financial', label: 'Financial Advisory' },
      { href: '/services/sales-marketing', label: 'Sales & Marketing Advisory' },
      { href: '/services/hr', label: 'Human Resources Advisory' },
      { href: '/services/management', label: 'Management Advisory' },
      { href: '/services/change-management', label: 'Change Management Advisory' },
      { href: '/services/ai', label: 'AI Advisory' },
      { href: '/services/past-projects', label: 'Past Projects' },
    ]
  },
  {
    label: 'Partner Offers',
    href: '/partner-offers',
    subLinks: Object.keys(partnerCategories).map(key => ({
        href: `/partner-offers/offers/${key}`,
        label: (partnerCategories as any)[key].name,
    }))
  },
  { href: '/docushare', label: 'DocuShare' },
  { href: '/membership', label: 'Membership' },
  { href: '/knowledge-center', label: 'Knowledge Center' },
  { href: '/contact', label: 'Contact Us' },
];

export default function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">
              Remote Business Partner
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) =>
            link.subLinks ? (
               <DropdownMenu key={link.label}>
                <DropdownMenuTrigger
                  className={cn(
                    'flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground',
                    pathname.startsWith(link.href) && 'text-foreground'
                  )}
                >
                  {link.label}
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {link.subLinks.map((subLink) => (
                    <DropdownMenuItem key={subLink.href} asChild>
                      <Link href={subLink.href}>{subLink.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  pathname === link.href && 'text-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="grid gap-4 py-6">
                  <Link href="/" className="flex items-center gap-2 font-bold">
                    <Logo className="h-8 w-8" />
                    <span>RBP</span>
                  </Link>
                  {navLinks.flatMap((link) => {
                    const mainLink = (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'flex w-full items-center py-2 text-lg font-semibold',
                          pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                    if (link.subLinks) {
                      const subLinks = link.subLinks.map((subLink) => (
                        <Link
                          key={subLink.href}
                          href={subLink.href}
                          className={cn(
                            'flex w-full items-center py-2 pl-6 text-base font-medium',
                            pathname === subLink.href ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {subLink.label}
                        </Link>
                      ));
                      return [mainLink, ...subLinks];
                    }
                    return mainLink;
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
