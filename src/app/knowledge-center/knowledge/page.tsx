
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    question: "What is a unit economy and why is it important?",
    answer: "Unit economics are the direct revenues and costs associated with a particular business model, expressed on a per-unit basis. Understanding them is crucial for assessing a company's profitability and scalability."
  },
  {
    question: "How do I calculate Customer Lifetime Value (LTV)?",
    answer: "A simple way to calculate LTV is: (Average Purchase Value) x (Average Purchase Frequency) x (Average Customer Lifespan). This helps you determine how much a customer is worth to your business over time."
  },
  {
    question: "What should be included in a pitch deck?",
    answer: "A standard pitch deck should include slides on the problem, solution, market size, product, business model, team, competitive landscape, financial projections, and the 'ask' (how much you're raising)."
  },
  {
    question: "What is the difference between a SAFE and a convertible note?",
    answer: "A SAFE (Simple Agreement for Future Equity) is an agreement to give an investor future equity in the company in exchange for cash today. A convertible note is a form of short-term debt that converts into equity, typically in conjunction with a future financing round. The main difference is that a SAFE is not debt, while a convertible note is."
  },
];

export default function KnowledgeBasePage() {
  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Knowledge Base
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Your searchable repository of business definitions, concepts, and frequently asked questions.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for a term or question..."
                className="w-full pl-10"
              />
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-semibold text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base">
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
