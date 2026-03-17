
import * as React from "react";
import { Button } from "./ui/button";
import { Logo } from "./logo";

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-base text-muted-foreground transition-colors hover:text-foreground">
    {children}
  </a>
);

const FooterColumn = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col space-y-4">
    <h3 className="text-sm font-medium text-foreground">{title}</h3>
    {children}
  </div>
);

export const MarketingFooter = () => {
  return (
    <footer className="bg-background text-foreground">
      <div className="container py-24">
        <div className="grid gap-16 lg:grid-cols-6">
          <div className="col-span-2 flex flex-col space-y-4">
            <a href="/" className="flex items-center space-x-2">
              <Logo />
              <span className="text-lg font-semibold">
                Remote Business Partner
              </span>
            </a>
            <p className="text-base text-muted-foreground">
              Your embedded strategic partner for operational excellence and growth.
            </p>
          </div>
          <div className="col-span-4 grid grid-cols-2 gap-8 md:grid-cols-4">
            <FooterColumn title="Explore">
              <FooterLink href="/docshare">DocShare</FooterLink>
              <FooterLink href="/partner-offers">Partner Offers</FooterLink>
            </FooterColumn>
            <FooterColumn title="Resources">
              <FooterLink href="/knowledge-center">Knowledge Center</FooterLink>
            </FooterColumn>
            <FooterColumn title="Services">
              <FooterLink href="/services">All Services</FooterLink>
            </FooterColumn>
            <FooterColumn title="Company">
              <FooterLink href="/membership">Membership</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </FooterColumn>
          </div>
        </div>
        <div className="mt-16 border-t pt-8 flex flex-col items-center justify-between md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Remote Business Partner. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
