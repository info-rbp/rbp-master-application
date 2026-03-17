
'use client';

import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GatedToolPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const handleToolExecution = () => {
    // In a real app, this would be a more complex process.
    // For this example, we'll just pass the input value to the results page.
    router.push(`/tools/gated-tool/results?output=${inputValue}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Gated Tool</h1>
        <div className="max-w-md mx-auto">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter some text"
            className="mb-4"
          />
          <Button onClick={handleToolExecution} className="w-full">Run Tool</Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
