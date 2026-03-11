
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    question: "Can I upgrade or downgrade my membership?",
    answer: "Yes, you can change your membership plan at any time from your account dashboard. Upgrades are effective immediately, while downgrades take effect at the end of your current billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also support invoicing and bank transfers."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "We do not offer a free trial for the Standard or Premium plans. However, our Basic plan is free forever and provides a great way to experience our platform and core resources."
  },
  {
    question: "What is your cancellation policy?",
    answer: "You can cancel your membership at any time. Your access will continue until the end of your current billing period, and you will not be charged again."
  },
  {
    question: "Are the legal documents suitable for my jurisdiction?",
    answer: "Our legal templates are designed to be broadly applicable for common law jurisdictions like the US, UK, and Australia. However, we always recommend consulting with a local lawyer to ensure full compliance with your specific regional laws."
  },
  {
    question: "How do I access advisory calls on the Premium plan?",
    answer: "Once you subscribe to the Premium plan, you will get access to a private booking link where you can schedule your one-on-one advisory calls with our experts at your convenience."
  },
];

export default function FaqPage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Have questions about our membership plans? Find the answers here.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-xl font-semibold text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base pt-2 pb-4">
                    {item.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </div>
      </section>
    </div>
  );
}
