import { buildSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export const metadata = buildSeoMetadata({ title: 'About Us', description: 'Learn about our mission, our story, and the team behind our success.', path: '/about' });

const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <section className={`py-16 md:py-24 ${className}`}>{children}</section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold tracking-tight text-center">{children}</h2>
);

const SectionDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="mt-4 text-lg text-muted-foreground text-center max-w-3xl mx-auto">{children}</p>
);


export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <Section className="bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">We're on a mission to help businesses thrive.</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">We believe that every business, regardless of size, deserves access to the expertise and resources needed to succeed. We're here to be your trusted partner in growth.</p>
        </div>
      </Section>

      {/* 2. Our Story */}
      <Section className="bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Our Story</h2>
                    <p className="mt-4 text-muted-foreground">Founded in 2020, our company was born out of a desire to provide businesses with a better way to access strategic guidance and operational support. We saw too many companies struggling to connect the dots between their vision and the execution required to make it a reality. We knew there had to be a better way.</p>
                    <p className="mt-4 text-muted-foreground">Since then, we've grown into a team of experienced consultants, strategists, and operators, all dedicated to helping our clients succeed. We're proud of the work we've done and the impact we've made, and we're just getting started.</p>
                </div>
                <div>
                    <Image src="https://via.placeholder.com/800x600" alt="Our Team" width={800} height={600} className="rounded-lg" />
                </div>
            </div>
        </div>
      </Section>

      {/* 3. Who We Help */}
      <Section>
        <div className="container mx-auto px-4 md:px-6">
          <SectionTitle>Who We Help</SectionTitle>
          <SectionDescription>We work with a diverse range of clients, from startups to established enterprises, across a variety of industries. What they all have in common is a desire to grow, innovate, and lead.</SectionDescription>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <Card>
                <CardHeader><CardTitle>Startups</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">We help startups lay the foundation for success, from developing a business plan to securing funding.</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Scale-ups</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">We help scale-ups navigate the challenges of growth, from scaling operations to entering new markets.</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Enterprises</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">We help enterprises innovate and stay ahead of the curve, from developing new products to optimizing processes.</p></CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* 4. How We Work */}
      <Section className="bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <SectionTitle>How We Work</SectionTitle>
           <SectionDescription>We take a collaborative, results-oriented approach to every engagement. We work as an extension of your team, providing the guidance and support you need to achieve your goals.</SectionDescription>
           <div className="grid md:grid-cols-2 gap-12 items-center mt-12">
                <div>
                    <Image src="https://via.placeholder.com/800x600" alt="Our Process" width={800} height={600} className="rounded-lg" />
                </div>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Collaborative Partnership</h3>
                            <p className="text-muted-foreground">We work with you, not for you. We believe in open communication, transparency, and a shared commitment to success.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Data-Driven Insights</h3>
                            <p className="text-muted-foreground">Our recommendations are grounded in data and analysis. We help you make informed decisions that drive results.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Focus on Execution</h3>
                            <p className="text-muted-foreground">A great strategy is only as good as its execution. We help you turn your vision into a reality.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </Section>

       {/* 5. Why Choose Us */}
       <Section>
        <div className="container mx-auto px-4 md:px-6">
            <SectionTitle>Why Choose Us?</SectionTitle>
            <SectionDescription>When you partner with us, you're not just hiring a consultant. You're gaining a dedicated partner committed to your success.</SectionDescription>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-center">
                <div>
                    <h3 className="text-xl font-semibold">Expertise</h3>
                    <p className="text-muted-foreground mt-2">Our team brings decades of experience across a wide range of industries and functions.</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Flexibility</h3>
                    <p className="text-muted-foreground mt-2">We offer a range of engagement models to meet your needs, from one-off projects to ongoing support.</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold">Results</h3>
                    <p className="text-muted-foreground mt-2">We're proud of the results we've delivered for our clients. Let us show you what we can do for you.</p>
                </div>
            </div>
        </div>
       </Section>

      {/* 6. Trust / Proof - Placeholder, recommend using the same testimonial component from the homepage */}
      <Section className="bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <SectionTitle>Don't just take our word for it.</SectionTitle>
            <SectionDescription>See what our clients are saying about their experience working with us.</SectionDescription>
            {/* Placeholder for testimonials */}
            <div className="mt-8 text-center">
                <p className="text-muted-foreground">Testimonials coming soon.</p>
            </div>
        </div>
      </Section>

      {/* 7. CTA Block */}
      <Section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to take the next step?</h2>
          <p className="mt-4 max-w-2xl mx-auto">Let's start a conversation about your business and how we can help you achieve your goals. </p>
          <div className="mt-8 flex gap-4 justify-center">
             <Button asChild size="lg" variant="secondary"><Link href="/advisory-booking">Book a Discovery Call</Link></Button>
             <Button asChild size="lg" variant="outline"><Link href="/contact">Contact Us</Link></Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
