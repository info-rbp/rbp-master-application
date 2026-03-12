'use client';

import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { BillingCycle, MembershipPlan, MembershipPlanCode, MembershipTier } from '@/lib/definitions';
import { MEMBERSHIP_PLAN_DEFINITIONS } from '@/lib/entitlements';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialForm = {
  code: 'basic_free' as MembershipPlanCode,
  tier: 'basic' as MembershipTier,
  description: '',
  amount: '0',
  currency: 'usd',
  billingCycle: 'free' as BillingCycle,
  active: true,
  promotionEligible: true,
  squareSubscriptionPlanVariationId: '',
  squareSubscriptionPlanId: '',
  squareLocationId: '',
};

const planCodeOptions = Object.keys(MEMBERSHIP_PLAN_DEFINITIONS) as MembershipPlanCode[];

export default function AdminMembershipPlansPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const syncFormFromCode = (code: MembershipPlanCode) => {
    const definition = MEMBERSHIP_PLAN_DEFINITIONS[code];
    setForm((prev) => ({
      ...prev,
      code,
      tier: definition.tier,
      billingCycle: definition.billingCycle,
      amount: String(definition.amount),
    }));
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(firestore, 'membership_plans'), orderBy('amount', 'asc')));
      setPlans(snapshot.docs.map((d) => {
        const row = d.data() as Partial<MembershipPlan>;
        const code = (row.code ?? 'basic_free') as MembershipPlanCode;
        const definition = MEMBERSHIP_PLAN_DEFINITIONS[code];
        return {
          id: d.id,
          code,
          tier: row.tier ?? definition.tier,
          billingCycle: row.billingCycle ?? definition.billingCycle,
          name: row.name ?? definition.displayName,
          description: row.description ?? '',
          amount: Number(row.amount ?? definition.amount),
          currency: String(row.currency ?? 'usd'),
          interval: row.interval ?? definition.billingCycle,
          active: Boolean(row.active),
          promotionEligible: Boolean(row.promotionEligible ?? true),
          squareSubscriptionPlanVariationId: row.squareSubscriptionPlanVariationId ?? null,
          squareSubscriptionPlanId: row.squareSubscriptionPlanId ?? null,
          squareLocationId: row.squareLocationId ?? null,
          squareCatalogObjectVersion: row.squareCatalogObjectVersion ?? null,
        };
      }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load plans', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPlans(); }, []);

  const isSquareMappingMissing = (plan: Pick<MembershipPlan, 'active' | 'squareSubscriptionPlanVariationId' | 'billingCycle'>) =>
    plan.active && plan.billingCycle !== 'free' && !plan.squareSubscriptionPlanVariationId;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const definition = MEMBERSHIP_PLAN_DEFINITIONS[form.code];
    if (definition.billingCycle !== 'free' && !form.squareSubscriptionPlanVariationId.trim()) {
      toast({ variant: 'destructive', title: 'Square mapping required', description: 'Paid plans must include a Square plan variation ID.' });
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(firestore, 'membership_plans'), {
        code: form.code,
        tier: form.tier,
        billingCycle: form.billingCycle,
        name: definition.displayName,
        description: form.description.trim(),
        amount: Number(form.amount),
        currency: form.currency.trim().toLowerCase(),
        interval: form.billingCycle,
        active: form.active,
        promotionEligible: form.promotionEligible,
        squareSubscriptionPlanVariationId: form.squareSubscriptionPlanVariationId.trim() || null,
        squareSubscriptionPlanId: form.squareSubscriptionPlanId.trim() || null,
        squareLocationId: form.squareLocationId.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    if (isSquareMappingMissing(plan)) {
      toast({ variant: 'destructive', title: 'Square mapping required', description: 'Paid active plans must include a Square plan variation ID.' });
      return;
    }

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
      <Card>
        <CardHeader><CardTitle>Create plan</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2"><Label>Plan code</Label><select className="h-10 rounded-md border px-3" value={form.code} onChange={(e) => syncFormFromCode(e.target.value as MembershipPlanCode)}>{planCodeOptions.map((code) => <option key={code} value={code}>{code}</option>)}</select></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Tier</Label><Input value={form.tier} readOnly /></div>
            <div className="space-y-2"><Label>Billing cycle</Label><Input value={form.billingCycle} readOnly /></div>
            <div className="space-y-2"><Label>Square Plan Variation ID</Label><Input value={form.squareSubscriptionPlanVariationId} onChange={(e) => setForm({ ...form, squareSubscriptionPlanVariationId: e.target.value })} /></div>
            <div className="space-y-2"><Label>Square Plan ID</Label><Input value={form.squareSubscriptionPlanId} onChange={(e) => setForm({ ...form, squareSubscriptionPlanId: e.target.value })} /></div>
            <div className="space-y-2"><Label>Square Location ID</Label><Input value={form.squareLocationId} onChange={(e) => setForm({ ...form, squareLocationId: e.target.value })} /></div>
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.promotionEligible} onChange={(e) => setForm({ ...form, promotionEligible: e.target.checked })} /><Label>Promotion eligible</Label></div>
            </div>
            <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create plan'}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing plans</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-muted-foreground">Loading plans...</p> : plans.length === 0 ? <p className="text-muted-foreground">No plans found.</p> : plans.map((plan, index) => (
            <div key={plan.id} className="grid gap-2 rounded border p-3 md:grid-cols-11">
              <Input value={plan.code} readOnly />
              <Input value={plan.tier} readOnly />
              <Input value={plan.billingCycle} readOnly />
              <Input value={plan.description} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, description: e.target.value } : p))} />
              <Input value={plan.amount} type="number" onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, amount: Number(e.target.value) } : p))} />
              <Input value={plan.currency} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, currency: e.target.value } : p))} />
              <Input value={plan.squareSubscriptionPlanVariationId || ''} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, squareSubscriptionPlanVariationId: e.target.value } : p))} placeholder="Variation ID" />
              <Input value={plan.squareSubscriptionPlanId || ''} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, squareSubscriptionPlanId: e.target.value } : p))} placeholder="Plan ID" />
              <Input value={plan.squareLocationId || ''} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, squareLocationId: e.target.value } : p))} placeholder="Location ID" />
              <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.active} onChange={(e) => setPlans((prev) => prev.map((p, i) => i === index ? { ...p, active: e.target.checked } : p))} />Active</div>
              <div className="flex gap-2"><Button size="sm" onClick={() => savePlan(plan)}>Save</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(plan.id)}>Delete</Button></div>
              {isSquareMappingMissing(plan) ? <p className="text-xs text-destructive md:col-span-11">This paid active plan cannot be sold until Square Plan Variation ID is set.</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
