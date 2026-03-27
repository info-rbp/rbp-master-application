'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ExternalLink } from 'lucide-react';

// Section: Hero
export const HeroSection = () => (
  <section className="relative bg-background overflow-hidden py-20 md:py-32">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">Exclusive Offers for Our Community</h1>
      <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">We've partnered with leading companies to bring you special discounts and deals on products and services that can help you grow your business.</p>
    </div>
  </section>
);

// Section: Overview
export const OverviewSection = () => (
    <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Unlock a World of Opportunity</h2>
                    <p className="mt-4 text-muted-foreground">As part of our commitment to your success, we're constantly working to build partnerships that provide real value to your business. Our offers are curated to help you save money, access new tools, and accelerate your growth.</p>
                    <p className="mt-4 text-muted-foreground">This is more than just a list of discounts. It's a collection of opportunities to invest in your business and your team.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Software</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Discounts on popular SaaS products.</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Services</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Special rates on professional services.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Hardware</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Deals on laptops, monitors, and more.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Events</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Tickets to industry conferences and workshops.</p></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </section>
);


// Section: Current Offers
export const CurrentOffersSection = ({ offers }) => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl font-bold tracking-tight text-center">Current Offers</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {offers.map((offer) => (
          <Card key={offer.id}>
            <CardHeader>
                <CardTitle>{offer.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{offer.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Section: Who They Are For
export const WhoTheyAreForSection = () => (
    <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Founders & Entrepreneurs</h3>
                            <p className="text-muted-foreground">Get the tools and resources you need to build and grow your business.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Small & Medium Businesses</h3>
                            <p className="text-muted-foreground">Equip your team with the best tools and save money in the process.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Enterprise Teams</h3>
                            <p className="text-muted-foreground">Take advantage of exclusive offers to drive innovation and efficiency.</p>
                        </div>
                    </div>
                </div>
                 <div>
                    <h2 className="text-3xl font-bold tracking-tight">Built for businesses of all sizes.</h2>
                    <p className="mt-4 text-muted-foreground">Our offers are designed to support businesses at every stage of their journey. Whether you're just starting out or you're a seasoned enterprise, you'll find valuable opportunities to help you succeed.</p>
                </div>
            </div>
        </div>
    </section>
);


// Section: How It Works
export const HowItWorksSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Accessing your offers is simple. </p>
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div>
          <h3 className="text-xl font-semibold">1. Browse</h3>
          <p className="text-muted-foreground mt-2">Explore the available offers from our partners.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">2. Access</h3>
          <p className="text-muted-foreground mt-2">Log in to our offers platform to view details and redemption instructions.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">3. Redeem</h3>
          <p className="text-muted-foreground mt-2">Follow the instructions to redeem the offer directly with the partner.</p>
        </div>
      </div>
    </div>
  </section>
);

// Section: CTA to Separate Offers Solution
export const CtaSection = () => (
  <section className="py-16 md:py-24 bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Ready to explore your offers?</h2>
      <p className="mt-4 max-w-2xl mx-auto">Log in to our dedicated offers platform to view, manage, and redeem your exclusive offers.</p>
      <div className="mt-8">
        <Button asChild size="lg" variant="secondary">
            <Link href="https://offers.example.com" target="_blank" rel="noopener noreferrer">
                Access the Offers Platform <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
        </Button>
      </div>
    </div>
  </section>
);
