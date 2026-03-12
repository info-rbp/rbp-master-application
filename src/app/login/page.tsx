'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/logo';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { resolvePostAuthPath } from '@/lib/return-path';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { useAuth } from '@/firebase/provider';

export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      // Ensure the user has verified their email. If not, sign them out and
      // redirect to the verification info page.
      if (credentials.user && !credentials.user.emailVerified) {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please verify your email before logging in.',
        });
        router.push('/verify-email');
        setIsLoading(false);
        return;
      }
      const token = await credentials.user.getIdToken();
      await fetch('/api/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ eventType: ANALYTICS_EVENTS.LOGIN_SUCCESS, metadata: { returnTo: searchParams.get('returnTo') ?? null } }) });
      const destination = resolvePostAuthPath(searchParams.get('returnTo'));
      if (searchParams.get('returnTo')) {
        await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ eventType: ANALYTICS_EVENTS.LOGIN_FROM_GATED_COMPLETED, metadata: { returnTo: destination } }) });
        await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ eventType: ANALYTICS_EVENTS.RETURN_TO_ORIGIN_AFTER_LOGIN, metadata: { destination } }) });
      }
      toast({
        title: 'Login Successful',
        description: 'Redirecting...',
      });
      router.push(destination);
    } catch (error: any) {
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center w-full max-w-sm">
        <Link href="/" className="mb-6 flex flex-col items-center">
          <Logo />
        </Link>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleLogin}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
