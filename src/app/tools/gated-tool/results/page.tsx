
'use client';

import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { useSearchParams } from "next/navigation";

export default function ToolResultsPage() {
    const searchParams = useSearchParams();
    const output = searchParams.get('output');

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Tool Results</h1>
        <div className="max-w-md mx-auto bg-gray-100 p-8 rounded-lg">
            <p className="text-center">{output}</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
