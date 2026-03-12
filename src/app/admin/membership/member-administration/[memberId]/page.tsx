'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MemberDetail, MemberNote, MembershipHistoryItem } from '@/lib/definitions';

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const auth = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [history, setHistory] = useState<MembershipHistoryItem[]>([]);
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [reason, setReason] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tierDraft, setTierDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [expiryDraft, setExpiryDraft] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideEndDate, setOverrideEndDate] = useState('');

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in as admin.');
    const token = await user.getIdToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Request failed');
    }
    return payload;
  }, [auth]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memberPayload, historyPayload, notesPayload] = await Promise.all([
        authedFetch(`/api/admin/membership/members/${memberId}`),
        authedFetch(`/api/admin/membership/members/${memberId}/history`),
        authedFetch(`/api/admin/membership/members/${memberId}/notes`),
      ]);

      const nextMember = memberPayload.data as MemberDetail;
      setMember(nextMember);
      setHistory(historyPayload.data as MembershipHistoryItem[]);
      setNotes(notesPayload.data as MemberNote[]);
      setTierDraft(nextMember.membershipTier);
      setStatusDraft(nextMember.membershipStatus);
      setExpiryDraft(nextMember.accessExpiry ? nextMember.accessExpiry.slice(0, 10) : '');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed loading member profile', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setLoading(false);
    }
  }, [authedFetch, memberId, toast]);

  useEffect(() => { void load(); }, [load]);

  const saveMembership = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await authedFetch(`/api/admin/membership/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          membershipTier: tierDraft,
          membershipStatus: statusDraft,
          membershipExpiresAt: expiryDraft ? new Date(expiryDraft).toISOString() : null,
          reason,
        }),
      });

      const historyItem = buildMembershipHistoryItem({
        memberId: member.id,
        oldTier: before.tier,
        newTier: tierDraft,
        oldStatus: before.status,
        newStatus: statusDraft,
        reason,
        changedBy: actor,
      });
      await addDoc(collection(firestore, 'membership_history'), historyItem);
      await addDoc(collection(firestore, 'audit_logs'), {
        actorUserId: auth.currentUser?.uid || 'unknown', actorRole: 'admin', actionType: 'membership_status_change', targetId: member.id, targetType: 'user', before, after: { tier: tierDraft, status: statusDraft }, metadata: { reason }, createdAt: new Date(),
      });

      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch('/api/lifecycle/membership-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userId: member.id,
            previousStatus: before.status,
            newStatus: statusDraft,
            membershipEndDate: expiryDraft || null,
            reason,
          }),
        });
      }

      await load();
      setReason('');
      await load();
      toast({ title: 'Membership updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save membership', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setSaving(false);
    }
  };

  const saveOverride = async (enabled: boolean) => {
    if (!member) return;
    if (enabled && !overrideReason.trim()) {
      toast({ variant: 'destructive', title: 'Override reason is required' });
      return;
    }
    if (!enabled && !window.confirm('Remove this member override?')) return;

    setSaving(true);
    try {
      if (enabled) {
        await authedFetch(`/api/admin/membership/members/${member.id}/override`, {
          method: 'PUT',
          body: JSON.stringify({ reason: overrideReason, endDate: overrideEndDate || null }),
        });
      } else {
        await authedFetch(`/api/admin/membership/members/${member.id}/override`, {
          method: 'DELETE',
          body: JSON.stringify({}),
        });
      }
      await load();
      toast({ title: enabled ? 'Override applied' : 'Override removed' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save override', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!member || !noteInput.trim()) return;
    setSaving(true);
    try {
      await authedFetch(`/api/admin/membership/members/${member.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      setNoteInput('');
      await load();
      toast({ title: 'Note added' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed adding note', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading member profile…</div>;
  if (!member) return <div className="p-8 text-muted-foreground">Member not found.</div>;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold">{member.name}</h1>
      <div className="flex gap-2"><Badge>{member.membershipTier}</Badge><Badge variant={member.membershipStatus === 'active' ? 'default' : 'secondary'}>{member.membershipStatus}</Badge>{member.overrideEnabled && <Badge variant="destructive">Override active</Badge>}</div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Profile summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Email: {member.email}</p><p>Phone: {member.phone || '—'}</p><p>Company: {member.company || '—'}</p><p>Role: {member.role}</p><p>Join date: {new Date(member.joinDate).toLocaleString()}</p><p>Last login: {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : '—'}</p><p>Email verification: {member.emailVerified ? 'Verified' : 'Unverified'}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Membership summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Tier: {member.membershipTier}</p><p>Status: {member.membershipStatus}</p><p>Access expiry: {member.accessExpiry ? new Date(member.accessExpiry).toLocaleString() : '—'}</p><p>Plan reference: {member.subscriptionPlanId || '—'}</p><p>Square subscription: {member.squareSubscriptionId || '—'}</p><p>Square customer: {member.squareCustomerId || '—'}</p><p>Square location: {member.squareLocationId || '—'}</p><p>Square subscription status: {member.squareSubscriptionStatus || '—'}</p><p>Plan code: {member.membershipPlanCode || '—'}</p><p>Billing cycle: {member.billingCycle || '—'}</p><p>Promotion grant ends: {member.activePromotionGrantEndAt ? new Date(member.activePromotionGrantEndAt).toLocaleString() : '—'}</p><p>Last payment status: {member.lastPaymentStatus || '—'}</p><p>Last payment date: {member.lastPaymentAt ? new Date(member.lastPaymentAt).toLocaleString() : '—'}</p><p>Override: {member.overrideEnabled ? 'Enabled' : 'Not enabled'}</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Admin actions</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Tier</Label><Select value={tierDraft} onValueChange={setTierDraft}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="none">None</SelectItem></SelectContent></Select><Label>Status</Label><Select value={statusDraft} onValueChange={setStatusDraft}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="lapsed">Lapsed</SelectItem></SelectContent></Select><Label>Expiry date</Label><Input type="date" value={expiryDraft} onChange={(e) => setExpiryDraft(e.target.value)} /><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for membership changes" /></div><div className="space-y-2"><Label>Override reason</Label><Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} /><Label>Override end date</Label><Input type="date" value={overrideEndDate} onChange={(e) => setOverrideEndDate(e.target.value)} /><div className="flex flex-wrap gap-2 pt-2"><Button disabled={saving} onClick={saveMembership}>Save tier/status</Button><Button disabled={saving} variant="outline" onClick={() => { setStatusDraft('suspended'); void saveMembership(); }}>Suspend access</Button><Button disabled={saving} variant="outline" onClick={() => { setStatusDraft('active'); void saveMembership(); }}>Reactivate access</Button><Button disabled={saving} variant="secondary" onClick={() => saveOverride(true)}>Apply override</Button><Button disabled={saving} variant="destructive" onClick={() => saveOverride(false)}>Remove override</Button></div></div></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Internal notes</CardTitle></CardHeader><CardContent className="space-y-4"><form onSubmit={submitNote} className="space-y-2"><Textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add admin-only note" /><Button type="submit" disabled={saving || !noteInput.trim()}>Add note</Button></form><div className="space-y-2">{notes.length === 0 ? <p className="text-muted-foreground">No notes recorded.</p> : notes.map((note) => <div key={note.id} className="rounded border p-2 text-sm"><p>{note.note}</p><p className="text-xs text-muted-foreground">{note.authorName || note.authorUserId} • {new Date(note.createdAt).toLocaleString()}</p></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>History & activity</CardTitle></CardHeader><CardContent className="space-y-2">{history.length === 0 ? <p className="text-muted-foreground">No history yet.</p> : history.map((item) => <div key={item.id} className="rounded border p-2 text-sm"><p>{item.oldTier || '—'} → {item.newTier || '—'} | {item.oldStatus || '—'} → {item.newStatus || '—'}</p><p className="text-xs text-muted-foreground">{item.reason || 'No reason'} • {item.changedBy} • {item.source || 'admin'} • {new Date(item.changedAt).toLocaleString()}</p></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
