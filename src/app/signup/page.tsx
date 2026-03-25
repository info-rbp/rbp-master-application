
import { SignupForm } from '@/app/portal/components/member-forms';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8">Create your account</h1>
          <SignupForm />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
