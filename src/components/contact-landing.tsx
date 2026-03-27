'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Calendar, Mail, Phone } from 'lucide-react';

// 1. Hero Section
export const ContactHero = () => (
    <section className="bg-background py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">Contact Us</h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">Have a question or want to work together? We\'d love to hear from you. Fill out the form below or book a discovery call directly.</p>
        </div>
    </section>
);

// 2. Contact Intro
export const ContactIntro = () => (
    <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="mt-4 text-muted-foreground">Whether you\'re a startup looking to scale, an established business seeking to optimize, or just have a question about what we do, our team is ready to help. Use the form for general enquiries or book a call for a dedicated consultation.</p>
        </div>
    </section>
);

// 4. Discovery Call Booking Block
export const DiscoveryCallBlock = () => (
    <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <Card className="bg-primary text-primary-foreground text-center p-8 md:p-12">
                <h2 className="text-3xl font-bold tracking-tight">Book a Free Discovery Call</h2>
                <p className="mt-4 max-w-2xl mx-auto">Schedule a 30-minute introductory call with our team to discuss your needs and see how we can help. No commitment, just a conversation.</p>
                <div className="mt-8">
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/advisory-booking">Book Discovery Call</Link>
                    </Button>
                </div>
            </Card>
        </div>
    </section>
);

// 5. Contact Details Section
export const ContactDetails = () => (
    <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Other Ways to Reach Us</h2>
                <p className="mt-4 text-lg text-muted-foreground">We\'re here to help in any way that works for you.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-center">
                <div className="flex flex-col items-center">
                    <Mail className="w-10 h-10 text-primary"/>
                    <h3 className="text-xl font-semibold mt-4">Email</h3>
                    <p className="text-muted-foreground mt-2">Send us a message for general enquiries.</p>
                    <Link href="mailto:hello@example.com" className="text-primary font-semibold hover:underline mt-2">hello@example.com</Link>
                </div>
                <div className="flex flex-col items-center">
                    <Phone className="w-10 h-10 text-primary"/>
                    <h3 className="text-xl font-semibold mt-4">Phone</h3>
                    <p className="text-muted-foreground mt-2">Speak to a member of our team directly.</p>
                    <span className="text-primary font-semibold mt-2">+1 (555) 123-4567</span>
                </div>
                <div className="flex flex-col items-center">
                    <Calendar className="w-10 h-10 text-primary"/>
                    <h3 className="text-xl font-semibold mt-4">Calendar</h3>
                    <p className="text-muted-foreground mt-2">Book a discovery call at your convenience.</p>
                     <Link href="/advisory-booking" className="text-primary font-semibold hover:underline mt-2">Book a Call</Link>
                </div>
            </div>
        </div>
    </section>
);

// 6. Final CTA Block
export const FinalCtaBlock = () => (
    <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">We Look Forward to Hearing From You</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">Your business challenges are our motivation. Let\'s start the conversation and explore what we can achieve together.</p>
        </div>
    </section>
);
