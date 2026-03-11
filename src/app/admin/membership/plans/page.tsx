'use client';

import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { MembershipPlan } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialForm = { name: '', description: '', amount: '', currency: 'usd', interval: 'month', active: true, stripePriceId: '' };

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
      setPlans(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MembershipPlan, 'id'>) })));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load plans', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPlans(); }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || Number(form.amount) <= 0) {
      toast({ variant: 'destructive', title: 'Validation failed', description: 'Name and positive amount are required.' });
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(firestore, 'membership_plans'), {
        name: form.name.trim(), description: form.description.trim(), amount: Number(form.amount), currency: form.currency.trim().toLowerCase(), interval: form.interval.trim().toLowerCase(), active: form.active, stripePriceId: form.stripePriceId.trim() || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Plan created' });
      setForm(initialForm);
      await loadPlans();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create plan', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (plan: MembershipPlan) => {
    try {
      await updateDoc(doc(firestore, 'membership_plans', plan.id), { ...plan, updatedAt: new Date().toISOString() });
      toast({ title: 'Plan updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update plan', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'membership_plans', id));
      toast({ title: 'Plan deleted' });
      await loadPlans();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete plan', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
      <Card><CardHeader><CardTitle>Create plan</CardTitle></CardHeader><CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}><div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div><div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div><div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div><div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} required /></div><div className="space-y-2"><Label>Interval</Label><Input value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} required /></div><div className="space-y-2"><Label>Stripe Price ID</Label><Input value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} /></div><div className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><Label>Active</Label></div><div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create plan'}</Button></div></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Existing plans</CardTitle></CardHeader><CardContent className="space-y-3">{loading ? <p className="text-muted-foreground">Loading plans...</p> : plans.length === 0 ? <p className="text-muted-foreground">No plans found.</p> : plans.map((plan, index) => (<div key={plan.id} className="grid gap-2 rounded border p-3 md:grid-cols-8"><Input value={plan.name} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} /><Input value={plan.description} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, description: e.target.value } : p))} /><Input value={plan.amount} type="number" onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, amount: Number(e.target.value) } : p))} /><Input value={plan.currency} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, currency: e.target.value } : p))} /><Input value={plan.interval} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, interval: e.target.value } : p))} /><Input value={plan.stripePriceId || ''} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, stripePriceId: e.target.value } : p))} /><div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.active} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, active: e.target.checked } : p))} />Active</div><div className="flex gap-2"><Button size="sm" onClick={() => savePlan(plan)}>Save</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(plan.id)}>Delete</Button></div></div>))}</CardContent></Card>
    </div>
  );
}
