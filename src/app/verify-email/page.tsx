import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buildAuthRedirectPath, sanitizeReturnPath } from '@/lib/return-path';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = sanitizeReturnPath(params.returnTo);

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We have sent a verification link to your email address. Please verify your account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={buildAuthRedirectPath('/login', returnTo)}>Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
