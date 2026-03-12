import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getFAQsByCategory } from '@/lib/data';

const fallbackFaqs = [
  { id: '1', question: 'How do I choose the right membership?', answer: 'Start with Basic and upgrade when you need deeper implementation support.' },
  { id: '2', question: 'Can I change tiers later?', answer: 'Yes, you can move between available tiers at any time from your account settings.' },
];

export default async function MembershipFaqPage() {
  const faqs = await getFAQsByCategory('membership');
  const items = faqs.length > 0 ? faqs : fallbackFaqs;

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Membership FAQ</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Answers to common questions about plans, features, and access.</p>
      </div>
      <Accordion type="single" collapsible className="max-w-3xl mx-auto w-full">
        {items.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
