'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';

// 1. Hero Section
export const HeroSection = () => (
  <section className="bg-background py-20 md:py-32">
    <div className="container mx-auto px-4 md:px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
        Power Your Business with Our Application Suite
      </h1>
      <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
        Access a curated set of powerful, ready-to-use applications designed to solve your toughest business challenges and accelerate growth.
      </p>
    </div>
  </section>
);

// 2. Applications Overview
export const ApplicationsOverviewSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">What Are Applications?</h2>
          <p className="mt-4 text-muted-foreground">
            Our applications are powerful, pre-built tools and workflows designed to give you a head start on complex business processes. From financial modeling to competitive analysis, these applications encapsulate industry best practices and our own strategic expertise.
          </p>
          <p className="mt-4 text-muted-foreground">
            Instead of starting from scratch, you can leverage these ready-made solutions to save time, reduce errors, and make better, data-driven decisions.
          </p>
        </div>
        <div className="flex justify-center">
            {/* Placeholder for an illustrative graphic */}
            <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-slate-500">Illustrative Graphic</span>
            </div>
        </div>
      </div>
    </div>
  </section>
);

// 3. Application Cards
export const ApplicationCardsSection = ({ applications }) => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl font-bold tracking-tight text-center">Explore Our Applications</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {applications.map((app) => (
          <Card key={app.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{app.title}</CardTitle>
              <CardDescription>{`For: ${app.audience}`}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{app.summary}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={app.accessLink} target="_blank" rel="noopener noreferrer">
                  Access Application <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// 4. Who They Are For
export const WhoTheyAreForSection = () => (
    <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Designed for Decision-Makers</h2>
                 <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Our applications are built for leaders and teams who need reliable data and powerful insights to drive their business forward.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-center">
                <div>
                    <h3 className="text-xl font-semibold">Strategic Leaders</h3>
                    <p className="text-muted-foreground mt-2">For executives and managers who need to model scenarios, analyze market trends, and make critical strategic decisions.</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Financial Teams</h3>
                    <p className="text-muted-foreground mt-2">For finance professionals who require robust tools for budgeting, forecasting, and financial performance analysis.</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Operational Units</h3>
                    <p className="text-muted-foreground mt-2">For teams on the ground who need to streamline workflows, manage projects, and track performance against key metrics.</p>
                </div>
            </div>
        </div>
    </section>
);

// 5. CTA Block
export const CtaBlockSection = () => (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Get Started?</h2>
          <p className="mt-4 max-w-2xl mx-auto">Contact us to learn more about how these applications can be integrated into your business.</p>
          <div className="mt-8">
             <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
    </section>
);