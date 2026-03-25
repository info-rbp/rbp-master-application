
import * as React from "react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from "lucide-react";

const PricingTier = ({ tier, price, description, features, cta, isFeatured }) => (
    <Card className={isFeatured ? "border-primary" : ""}>
        <CardHeader>
            <CardTitle className="flex justify-between">
                <span>{tier}</span>
                {isFeatured && <span className="text-xs font-semibold bg-primary text-primary-foreground py-1 px-2 rounded-pill">MOST POPULAR</span>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-6">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <Check className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button className="w-full" variant={isFeatured ? "primary" : "secondary"}>{cta}</Button>
        </CardContent>
    </Card>
);

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-accent text-center py-24 sm:py-32">
          <div className="container">
            <h1 className="text-h1 font-bold tracking-tighter">Membership Plans</h1>
            <p className="max-w-2xl mx-auto mt-6 text-body-l text-muted-foreground">
              Choose the plan that best fits your business needs. Unlock operational assets, exclusive offers, and priority support to accelerate your growth.
            </p>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className="py-24 sm:py-32">
          <div className="container grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <PricingTier 
                tier="Standard"
                price="$49"
                description="Essential access to core operational assets and our resource library."
                features={[
                    "Full access to DocShare library",
                    "Standard partner offers",
                    "Access to Knowledge Center",
                    "Community support"
                ]}
                cta="Get Started with Standard"
                isFeatured={false}
            />
            <PricingTier 
                tier="Premium"
                price="$99"
                description="The complete package for teams serious about operational excellence and growth."
                features={[
                    "Everything in Standard, plus:",
                    "Premium partner offers & discounts",
                    "Priority support queue",
                    "Early access to new resources",
                    "1-hour monthly advisory check-in"
                ]}
                cta="Get Started with Premium"
                isFeatured={true}
            />
            <PricingTier 
                tier="Enterprise"
                price="Custom"
                description="Dedicated, white-glove service for organizations with complex needs."
                features={[
                    "Everything in Premium, plus:",
                    "Dedicated account manager",
                    "Custom resource creation",
                    "On-demand strategic advisory",
                    "Team training & onboarding"
                ]}
                cta="Contact Us for Enterprise"
                isFeatured={false}
            />
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
