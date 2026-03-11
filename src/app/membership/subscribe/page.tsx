'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase/provider';
import type { MembershipPlan } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function MembershipSubscribePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const plansRef = collection(firestore, 'membership_plans');
        const snapshot = await getDocs(query(plansRef, where('active', '==', true)));
        const loadedPlans = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            interval: data.interval,
            active: Boolean(data.active),
            stripePriceId: data.stripePriceId,
          } as MembershipPlan;
        });
        setPlans(loadedPlans);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Unable to load plans',
          description: error instanceof Error ? error.message : 'Please try again shortly.',
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, [firestore, toast]);

  const handleSubscribe = async (planId: string) => {
    setCheckoutPlanId(planId);
    try {
      if (!user) throw new Error('Please log in to start checkout.');
      const token = await user.getIdToken();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });

      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Could not start checkout session.');
      }

      window.location.assign(payload.url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Subscription failed',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setCheckoutPlanId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Choose your membership</h1>
      <p className="text-muted-foreground mb-8">Select an active plan and continue to secure checkout.</p>

      {loading ? (
        <p className="text-muted-foreground">Loading plans...</p>
      ) : plans.length === 0 ? (
        <p className="text-muted-foreground">No active membership plans are available right now.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {plan.currency.toUpperCase()} {Number(plan.amount).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Billed every {plan.interval}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={checkoutPlanId === plan.id}
                >
                  {checkoutPlanId === plan.id ? 'Redirecting...' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
