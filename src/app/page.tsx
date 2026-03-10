import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Library, RefreshCw, Rocket } from 'lucide-react';
import Logo from '@/components/logo';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LandingPage() {
  const { hero, testimonial1, testimonial2, testimonial3 } = placeholderImages;
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="font-bold">DocShare</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2">
             <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Your Business Document Powerhouse
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                A comprehensive platform of documents, templates, and resources for startups, entrepreneurs, and small business owners to access anytime.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/portal">Explore Documents</Link>
                </Button>
              </div>
            </div>
          </div>
           <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"
            style={{opacity: 0.15}}
           ></div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                    Key Features
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Everything you need to succeed.
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                    Our platform is built from the ground up to provide you with the tools and resources for every stage of your business journey.
                  </p>
                </div>
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Library className="h-5 w-5 text-primary" />Curated Document Library</h3>
                      <p className="text-muted-foreground">
                        Access a vast collection of professionally crafted templates and documents.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" />Always Up-to-Date</h3>
                      <p className="text-muted-foreground">
                        Our library is constantly updated to reflect the latest legal and industry standards.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" />For Every Stage of Business</h3>
                      <p className="text-muted-foreground">
                        From business plans to HR policies, find what you need, when you need it.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
               <Image
                src={hero.src}
                alt="Business documents"
                width={hero.width}
                height={hero.height}
                data-ai-hint={hero.hint}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Loved by Entrepreneurs
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear what our users are saying about their experience with DocShare.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 pt-12 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    “DocShare has been a game-changer for our startup. Access to reliable templates saved us countless hours and legal fees.”
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial1.src} alt="Testimonial author Jane Doe" data-ai-hint={testimonial1.hint} />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Jane Doe</p>
                      <p className="text-sm text-muted-foreground">Founder, Tech Innovators</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    “As a solo entrepreneur, I wear many hats. DocShare is like having a legal and HR department in my back pocket.”
                  </p>
                   <div className="mt-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial2.src} alt="Testimonial author John Smith" data-ai-hint={testimonial2.hint} />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">John Smith</p>
                      <p className="text-sm text-muted-foreground">CEO, Smith Consulting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    “The quality and breadth of the documents available are unmatched. It’s an essential tool for any small business.”
                  </p>
                   <div className="mt-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial3.src} alt="Testimonial author Emily White" data-ai-hint={testimonial3.hint} />
                      <AvatarFallback>EW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Emily White</p>
                      <p className="text-sm text-muted-foreground">Owner, The Local Bakery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Ready to Streamline Your Business?
                </h2>
                <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Dive into our comprehensive document library and give your business the professional edge it deserves.
                </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button asChild size="lg" variant="secondary">
                        <Link href="/signup">Get Started Now</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo className="h-8 w-8" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by Remote Business Partner.
            </p>
          </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <p className="text-center">
                &copy; {new Date().getFullYear()} DocShare. All Rights Reserved.
              </p>
              <Link href="/admin/login" className="hover:underline">Admin Login</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
