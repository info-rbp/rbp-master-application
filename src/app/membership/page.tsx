
import * as React from "react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Package } from "lucide-react";

const ValuePillarCard = ({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) => (
    <div className="flex flex-col items-center text-center">
        <div className="bg-accent p-4 rounded-full">
            {icon}
        </div>
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
);

export default function MembershipPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-accent text-center py-24 sm:py-32">
          <div className="container">
            <h1 className="text-h1 font-bold tracking-tighter">Unlock Your Operational Toolkit</h1>
            <p className="max-w-2xl mx-auto mt-6 text-body-l text-muted-foreground">
              Membership gives you direct access to a curated library of operational resources, exclusive partner offers, and a community of forward-thinking business leaders.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="large" variant="primary" asChild><a href="/membership/pricing">View Plans & Pricing</a></Button>
              <Button size="large" variant="secondary">Explore Member Content</Button>
            </div>
          </div>
        </section>

        {/* Value Pillars Section */}
        <section className="py-24 sm:py-32">
          <div className="container">
            <div className="text-center">
              <h2 className="text-h2 font-bold tracking-tighter">The Value of Membership</h2>
              <p className="max-w-xl mx-auto mt-4 text-body-l text-muted-foreground">
                Go beyond advice. Get the tools, resources, and support you need to execute.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
              <ValuePillarCard title="Operational Asset Library" description="Access hundreds of templates, guides, and processes in our DocShare library." icon={<Package />} />
              <ValuePillarCard title="Exclusive Partner Offers" description="Save thousands on top-tier software and services from our curated partner ecosystem." icon={<Package />} />
              <ValuePillarCard title="Priority Support & Advisory" description="Get prioritized access to our team for customisation requests and strategic check-ups." icon={<Package />} />
            </div>
          </div>
        </section>

        {/* Access Details Section */}
        <section className="bg-accent py-24 sm:py-32">
          <div className="container grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-h2 font-bold tracking-tighter">What Members Can Access</h2>
              <p className="mt-4 text-body-l text-muted-foreground">
                Your membership is the key to a comprehensive suite of resources designed to help you build, operate, and scale your business more effectively.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">DocShare Library:</span> Full access to all business templates, documentation suites, and process guides.</span></li>
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Partner Offers:</span> Unlock exclusive discounts and premium benefits from partners like Square, Google, and more.</span></li>
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Knowledge Center:</span> Unlimited access to in-depth guides, articles, and tools.</span></li>
                <li className="flex items-start"><CheckCircle className="h-6 w-6 text-primary mr-4 mt-1" /><span><span className="font-semibold">Priority Service Queues:</span> Get faster turnaround on support and customisation requests.</span></li>
              </ul>
            </div>
            <Card className="p-8">
                <CardHeader>
                    <CardTitle>How Access Works</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Once you become a member, you can instantly access all gated content and offers by signing into your portal. Resources are clearly marked with your membership level, so you always know what's available to you.</p>
                    <Button variant="tertiary" className="mt-4">Learn more about the member portal <ArrowRight className="ml-2" /></Button>
                </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Bridge Section */}
        <section className="py-24 sm:py-32">
          <div className="container text-center">
            <h2 className="text-h2 font-bold tracking-tighter">Find the Plan That's Right for You</h2>
            <p className="max-w-xl mx-auto mt-4 text-body-l text-muted-foreground">
              We offer flexible plans designed for businesses at every stage. Compare our membership tiers to see which benefits and access levels fit your needs.
            </p>
            <div className="mt-8">
              <Button size="large" asChild><a href="/membership/pricing">Compare Plans & See Pricing</a></Button>
            </div>
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
