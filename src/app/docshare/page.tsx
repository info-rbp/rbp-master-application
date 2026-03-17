
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { DocShareAssistant } from "@/components/doc-share-assistant";

export default function DocSharePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow container py-12">
        <div className="text-center mb-12">
          <h1 className="text-h1 font-bold tracking-tighter">DocShare Assistant</h1>
          <p className="max-w-2xl mx-auto mt-4 text-body-l text-muted-foreground">
            Your AI-powered assistant for finding and understanding our extensive library of business documents, templates, and guides.
          </p>
        </div>
        <DocShareAssistant />
      </main>
      <MarketingFooter />
    </div>
  );
}
