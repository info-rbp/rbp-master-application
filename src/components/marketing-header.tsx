
import * as React from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { Logo } from "./logo";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-base font-medium text-foreground transition-colors hover:text-primary">
    {children}
  </a>
);

export const MarketingHeader = () => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      { "h-16": isScrolled, "h-20": !isScrolled }
    )}>
      <div className="container flex h-full items-center">
        <div className="mr-4 hidden md:flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
            <span className="hidden font-bold sm:inline-block">
              Remote Business Partner
            </span>
          </a>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink href="/docshare">DocShare</NavLink>
            <NavLink href="/partner-offers">Partner Offers</NavLink>
            <NavLink href="/knowledge-center">Knowledge Center</NavLink>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/membership">Membership</NavLink>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search bar can be added here later */}
          </div>
          <nav className="hidden md:flex">
            <Button variant="secondary" size="medium">
              Book Discovery Call
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
            <a href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
              <span className="font-bold">
                Remote Business Partner
              </span>
            </a>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-4">
                <NavLink href="/docshare">DocShare</NavLink>
                <NavLink href="/partner-offers">Partner Offers</NavLink>
                <NavLink href="/knowledge-center">Knowledge Center</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/membership">Membership</NavLink>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
