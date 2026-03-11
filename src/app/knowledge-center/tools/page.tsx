
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calculator, BarChart, Presentation } from 'lucide-react';
import Link from 'next/link';

const tools = [
  {
    title: "SaaS Financial Model",
    description: "A comprehensive financial model template for SaaS startups, including cohort analysis, MRR forecasting, and cash flow projections.",
    icon: Calculator,
    href: "#"
  },
  {
    title: "Pitch Deck Template",
    description: "A professionally designed 12-slide pitch deck template to help you tell a compelling story to investors. (PowerPoint & Google Slides).",
    icon: Presentation,
    href: "#"
  },
  {
    title: "Board Reporting Pack",
    description: "A template for creating insightful and concise board reports, including financial summaries, KPI dashboards, and strategic updates.",
    icon: BarChart,
    href: "#"
  }
];

export default function ToolsPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Tools & Templates
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Downloadable financial models, report templates, and other practical tools to accelerate your work.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card key={tool.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                     <tool.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-center text-xl">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-center">{tool.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={tool.href}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
