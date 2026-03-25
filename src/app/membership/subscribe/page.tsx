"use client";


import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
  const router = useRouter();

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/square/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' }), // This would be dynamic in a real app
      });

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        router.push(checkoutUrl);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 mb-8">Select the best plan for your needs.</p>
          <div className="border rounded-lg p-8">
            <h2 className="text-2xl font-bold">Premium Plan</h2>
            <p className="text-4xl font-extrabold my-4">$99/mo</p>
            <Button onClick={handleSubscribe} className="w-full">
              Subscribe
            </Button>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
