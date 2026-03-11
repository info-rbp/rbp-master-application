import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { ArrowRight, BarChart, Briefcase, DollarSign, GitBranch, Target, Shield } from 'lucide-react';

const services = [
  {
    category: "Strategy & Planning",
    icon: Target,
    description: "Navigate your growth journey with a clear roadmap. We help you define your vision, identify opportunities, and build actionable strategies.",
    items: ["Business Plans", "Market Entry Strategy", "Competitive Analysis", "Corporate Strategy"]
  },
  {
    category: "Financial Management",
    icon: DollarSign,
    description: "Build a robust financial foundation. We provide expert financial modeling, forecasting, and analysis to drive informed decisions.",
    items: ["Financial Modelling", "Budgeting & Forecasting", "Unit Economics", "FP&A Support"]
  },
  {
    category: "Capital & Growth",
    icon: BarChart,
    description: "Secure the funding you need to scale. We guide you through the capital raising process, from pitch decks to investor relations.",
    items: ["Capital Raising Strategy", "Pitch Deck Preparation", "Due Diligence Support", "Investor Relations"]
  },
  {
    category: "Governance & Operations",
    icon: Briefcase,
    description: "Optimize your business for efficiency and scale. We help you establish strong governance and streamline your core operations.",
    items: ["Board & Management Reporting", "ESOP Management", "Process Improvement", "System Implementation"]
  }
];

export default function ServicesPage() {
  const { servicesHero } = placeholderImages;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Advisory on Demand
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Flexible, expert support to help your business navigate challenges and unlock growth. We provide the strategic horsepower you need, precisely when you need it.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {services.map(service => (
              <Card key={service.category} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <service.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">{service.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{service.description}</p>
                  <ul className="mt-6 space-y-2">
                    {service.items.map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-16 text-center">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to get started?</h2>
             <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                Let's build the future of your business, together.
             </p>
             <Button size="lg" className="mt-6" asChild>
                <Link href="/contact">Book a Free Consultation</Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
