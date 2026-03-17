
import * as React from "react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";

const ServiceCategoryCard = ({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="items-center">
      <div className="bg-accent p-4 rounded-full">
        {icon}
      </div>
      <CardTitle className="mt-4 text-center">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-center">
      <p className="text-muted-foreground">{description}</p>
      <Button variant="tertiary" className="mt-4">Learn More <ArrowRight className="ml-2" /></Button>
    </CardContent>
  </Card>
);

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-accent text-center py-24 sm:py-32">
          <div className="container">
            <h1 className="text-h1 font-bold tracking-tighter">Strategic & Operational Services</h1>
            <p className="max-w-2xl mx-auto mt-6 text-body-l text-muted-foreground">
              We help organizations improve performance, solve complex challenges, and build stronger foundations for growth through flexible, cross-functional advisory support.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="large" variant="primary">Book a Discovery Call</Button>
              <Button size="large" variant="secondary">Explore Membership</Button>
            </div>
          </div>
        </section>

        {/* Featured Service Categories Section */}
        <section className="py-24 sm:py-32">
          <div className="container">
            <div className="text-center">
              <h2 className="text-h2 font-bold tracking-tighter">Our Core Service Areas</h2>
              <p className="max-w-xl mx-auto mt-4 text-body-l text-muted-foreground">
                Targeted expertise to solve your most pressing business challenges.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <ServiceCategoryCard title="Strategy & Growth" description="Align your vision, identify market opportunities, and create a roadmap for sustainable growth." icon={<ArrowRight />} />
              <ServiceCategoryCard title="Operations & Efficiency" description="Streamline processes, optimize workflows, and build scalable systems for peak performance." icon={<ArrowRight />} />
              <ServiceCategoryCard title="Finance & Commercial" description="Improve financial clarity, manage cash flow, and make data-driven commercial decisions." icon={<ArrowRight />} />
              <ServiceCategoryCard title="People & Enablement" description="Develop talent, foster a high-performance culture, and empower your team to succeed." icon={<ArrowRight />} />
              <ServiceCategoryCard title="Systems & Process Design" description="Implement the right tools and design robust processes to support your strategic goals." icon={<ArrowRight />} />
              <ServiceCategoryCard title="Growth Support" description="Get hands-on support to execute growth initiatives and achieve your targets." icon={<ArrowRight />} />
            </div>
          </div>
        </section>

        {/* Engagement Model Section */}
        <section className="bg-accent py-24 sm:py-32">
          <div className="container grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-h2 font-bold tracking-tighter">How We Engage</h2>
              <p className="mt-4 text-body-l text-muted-foreground">
                We are not traditional consultants. We are flexible, embedded partners dedicated to your success. Our engagement model is designed for impact and adaptability.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Advisory Retainers:</span> Ongoing strategic guidance and support.</span></li>
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Project-Based Engagements:</span> Defined scope, clear deliverables, and measurable outcomes.</span></li>
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Fractional Leadership:</span> Embedded expertise to fill critical leadership gaps.</span></li>
              </ul>
            </div>
            <div className="bg-background p-8 rounded-card shadow-lg">
              <h3 className="text-h3 font-semibold">Typical Outcomes</h3>
              <p className="mt-2 text-muted-foreground">Clients typically see significant improvements in:</p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Increased operational efficiency</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Improved profitability</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Enhanced team performance and alignment</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" /> Clearer strategic roadmap</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 sm:py-32">
          <div className="container text-center">
            <h2 className="text-h2 font-bold tracking-tighter">Ready to build a stronger foundation?</h2>
            <p className="max-w-xl mx-auto mt-4 text-body-l text-muted-foreground">
              Let's discuss how our advisory services can help you achieve your strategic objectives.
            </p>
            <div className="mt-8">
              <Button size="large">Book Your Free Discovery Call</Button>
            </div>
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
