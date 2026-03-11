'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { categories } from '../data';

const navLinks = Object.keys(categories).map(key => ({
    href: `/partner-offers/offers/${key}`,
    label: categories[key as keyof typeof categories].name,
}));


export default function OffersHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/partner-offers" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block">
              Partner Offers
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          {navLinks.map((link) => (
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
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
            <Button asChild>
                <Link href="/signup">Get Access</Link>
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
                  <Link href="/partner-offers" className="flex items-center gap-2 font-bold">
                    <Logo className="h-8 w-8" />
                    <span>Partner Offers</span>
                  </Link>
                  {navLinks.map((link) => (
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
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
