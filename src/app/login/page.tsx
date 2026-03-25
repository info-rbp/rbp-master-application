import { SigninForm } from '@/app/portal/components/member-forms';
import MarketingHeader from '@/components/marketing-header';
import MarketingFooter from '@/components/marketing-footer';
import { platformEnv } from '@/lib/platform/config';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground">
              {platformEnv.localAuthEnabled
                ? 'Local development auth is enabled. Use admin@rbp.local or member@rbp.local with password123!.'
                : 'Authenticate through Authentik to load your tenant, permissions, modules, and navigation context.'}
            </p>
          </div>
          {platformEnv.localAuthEnabled ? (
            <SigninForm />
          ) : (
            <a
              href="/api/auth/login?returnTo=/dashboard"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Continue with Authentik
            </a>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
