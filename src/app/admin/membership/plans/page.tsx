'use client';

import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { MembershipPlan } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialForm = {
  name: '',
  description: '',
  amount: '',
  currency: 'usd',
  interval: 'month',
  active: true,
  stripePriceId: '',
};

export default function AdminMembershipPlansPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(firestore, 'membership_plans'), orderBy('amount', 'asc')));
      setPlans(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            description: data.description,
            amount: Number(data.amount),
            currency: data.currency,
            interval: data.interval,
            active: Boolean(data.active),
            stripePriceId: data.stripePriceId,
          };
        }),
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load plans',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(firestore, 'membership_plans'), {
        name: form.name.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        currency: form.currency.trim().toLowerCase(),
        interval: form.interval.trim().toLowerCase(),
        active: form.active,
        stripePriceId: form.stripePriceId.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast({ title: 'Plan created', description: 'Membership plan added successfully.' });
      setForm(initialForm);
      await loadPlans();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create plan',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'membership_plans', id));
      toast({ title: 'Plan deleted' });
      await loadPlans();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete plan',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <Input id="interval" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripePriceId">Stripe Price ID</Label>
              <Input id="stripePriceId" value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create plan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground">No plans found.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.currency.toUpperCase()} {plan.amount} / {plan.interval}</p>
                  <p className="text-xs text-muted-foreground">{plan.active ? 'Active' : 'Inactive'}</p>
                </div>
                <Button variant="destructive" onClick={() => handleDelete(plan.id)}>Delete</Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
