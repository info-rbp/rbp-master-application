import Link from 'next/link';
import Logo from '@/components/logo';

export default function OffersFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/partner-offers" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="font-bold">Partner Offers</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Exclusive deals and discounts to help you grow your business.
            </p>
          </div>
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="font-semibold">Categories</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/partner-offers/offers/top" className="text-muted-foreground hover:text-foreground">Top</Link></li>
              <li><Link href="/partner-offers/offers/new" className="text-muted-foreground hover:text-foreground">New</Link></li>
              <li><Link href="/partner-offers/offers/exclusive" className="text-muted-foreground hover:text-foreground">Exclusive</Link></li>
              <li><Link href="/partner-offers/offers/all" className="text-muted-foreground hover:text-foreground">All</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2 md:col-start-9">
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Main Site</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Login</Link></li>
            </ul>
          </div>
           <div className="md:col-span-2 md:col-start-11">
            <h4 className="font-semibold">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Remote Business Partner. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
