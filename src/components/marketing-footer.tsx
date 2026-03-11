import Link from 'next/link';
import { Twitter, Linkedin, Facebook } from 'lucide-react';
import Logo from './logo';
import { Button } from './ui/button';

export default function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="font-bold">Remote Business Partner</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your strategic partner for business growth and efficiency.
            </p>
            <div className="mt-4 flex space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link href="/past-projects" className="text-muted-foreground hover:text-foreground">Case Studies</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold">Services</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/services" className="text-muted-foreground hover:text-foreground">Advisory on Demand</Link></li>
              <li><Link href="/docushare" className="text-muted-foreground hover:text-foreground">DocuShare Portal</Link></li>
              <li><Link href="/partner-offers" className="text-muted-foreground hover:text-foreground">Partner Offers</Link></li>
            </ul>
          </div>
           <div className="md:col-span-2">
            <h4 className="font-semibold">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Remote Business Partner. All Rights Reserved.</p>
           <Link href="/admin/login" className="hover:underline mt-4 md:mt-0">Admin Login</Link>
        </div>
      </div>
    </footer>
  );
}
