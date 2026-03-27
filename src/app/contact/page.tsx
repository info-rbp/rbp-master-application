import { buildSeoMetadata } from '@/lib/seo';
import ContactForm from '@/components/contact-form';
import {
    ContactHero,
    ContactIntro,
    DiscoveryCallBlock,
    ContactDetails,
    FinalCtaBlock
} from '@/components/contact-landing';

export const metadata = buildSeoMetadata({
    title: 'Contact Us',
    description: 'Get in touch with our team. Whether you have a question or want to work with us, we\'d love to hear from you.',
    path: '/contact'
});

export default function ContactPage() {
    return (
        <div>
            <ContactHero />
            <ContactIntro />

            {/* 3. Enquiry Form - This section will now wrap the existing ContactForm component */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-8">Send Us a Message</h2>
                         {/* The existing ContactForm component is placed here. */}
                        <ContactForm />
                    </div>
                </div>
            </section>

            <DiscoveryCallBlock />
            <ContactDetails />
            <FinalCtaBlock />
        </div>
    );
}