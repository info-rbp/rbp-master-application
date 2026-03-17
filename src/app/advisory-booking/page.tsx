
'use client';

import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdvisoryBookingPage() {

  const handleBooking = () => {
    // In a real app, this would integrate with a booking service.
    alert("Your booking has been requested. We will contact you shortly to confirm.");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-col container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">Book an Advisory Session</h1>
        <div className="max-w-md mx-auto">
            <Input placeholder="Your Name" className="mb-4"/>
            <Input placeholder="Your Email" type="email" className="mb-4"/>
            <Textarea placeholder="What would you like to discuss?" className="mb-4"/>
          <Button onClick={handleBooking} className="w-full">Request Booking</Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
