'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { MemberDetail, MemberNote, MemberOverride, MembershipHistoryItem } from '@/lib/definitions';
import { buildMembershipHistoryItem, normalizeMemberRow } from '@/lib/membership-crm';

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [history, setHistory] = useState<MembershipHistoryItem[]>([]);
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [override, setOverride] = useState<MemberOverride | null>(null);
  const [reason, setReason] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tierDraft, setTierDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [expiryDraft, setExpiryDraft] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideEndDate, setOverrideEndDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const userSnap = await getDoc(doc(firestore, 'users', memberId));
      if (!userSnap.exists()) {
        setMember(null);
        return;
      }

      const normalized = normalizeMemberRow({ id: userSnap.id, ...userSnap.data() });
      setMember({ ...normalized, company: userSnap.data().company ?? null, phone: userSnap.data().phone ?? null, subscriptionPlanId: userSnap.data().subscriptionPlanId ?? null });
      setTierDraft(normalized.membershipTier);
      setStatusDraft(normalized.membershipStatus);
      setExpiryDraft(normalized.accessExpiry ? normalized.accessExpiry.slice(0, 10) : '');

      const [historySnap, notesSnap, overrideSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'membership_history'), where('memberId', '==', memberId), orderBy('changedAt', 'desc'))),
        getDocs(query(collection(firestore, 'member_notes'), where('memberId', '==', memberId), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(firestore, 'member_overrides'), where('memberId', '==', memberId))),
      ]);

      setHistory(historySnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MembershipHistoryItem, 'id'>) })));
      setNotes(notesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MemberNote, 'id'>) })));

      const firstOverride = overrideSnap.docs[0];
      setOverride(firstOverride ? ({ id: firstOverride.id, ...(firstOverride.data() as Omit<MemberOverride, 'id'>) }) : null);
      setOverrideReason(firstOverride?.data().reason ?? '');
      setOverrideEndDate(firstOverride?.data().endDate ? String(firstOverride.data().endDate).slice(0, 10) : '');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed loading member profile', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [memberId]);

  const actor = useMemo(() => auth.currentUser?.email || auth.currentUser?.uid || 'admin', [auth.currentUser]);

  const saveMembership = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const before = { tier: member.membershipTier, status: member.membershipStatus };
      await updateDoc(doc(firestore, 'users', member.id), {
        membershipTier: tierDraft,
        membershipStatus: statusDraft,
        membershipExpiresAt: expiryDraft ? new Date(expiryDraft).toISOString() : null,
        updatedAt: new Date().toISOString(),
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
      toast({ title: 'Membership updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed saving membership', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      setSaving(false);
    }
  };

  const saveOverride = async (enabled: boolean) => {
    if (!member) return;
    setSaving(true);
    try {
      const payload = {
        memberId: member.id,
        enabled,
        reason: overrideReason,
        startDate: override?.startDate || new Date().toISOString(),
        endDate: overrideEndDate ? new Date(overrideEndDate).toISOString() : null,
        changedBy: actor,
        changedAt: new Date().toISOString(),
      };
      const targetRef = override ? doc(firestore, 'member_overrides', override.id) : doc(collection(firestore, 'member_overrides'));
      await setDoc(targetRef, payload, { merge: true });
      await updateDoc(doc(firestore, 'users', member.id), { overrideEnabled: enabled, updatedAt: new Date().toISOString() });
      await addDoc(collection(firestore, 'audit_logs'), { actorUserId: auth.currentUser?.uid || 'unknown', actorRole: 'admin', actionType: 'manual_access_override', targetId: member.id, targetType: 'user', after: payload, createdAt: new Date() });
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
      const now = new Date().toISOString();
      await addDoc(collection(firestore, 'member_notes'), {
        memberId: member.id,
        authorUserId: auth.currentUser?.uid || 'unknown',
        authorName: auth.currentUser?.displayName || actor,
        note: noteInput.trim(),
        createdAt: now,
        updatedAt: now,
      });
      await addDoc(collection(firestore, 'audit_logs'), { actorUserId: auth.currentUser?.uid || 'unknown', actorRole: 'admin', actionType: 'user_profile_admin_edit', targetId: member.id, targetType: 'member_note', metadata: { notePreview: noteInput.slice(0, 40) }, createdAt: new Date() });
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
        <Card><CardHeader><CardTitle>Profile summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Email: {member.email}</p><p>Phone: {member.phone || '—'}</p><p>Company: {member.company || '—'}</p><p>Role: {member.role}</p><p>Join date: {new Date(member.joinDate).toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Membership summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p>Tier: {member.membershipTier}</p><p>Status: {member.membershipStatus}</p><p>Access expiry: {member.accessExpiry ? new Date(member.accessExpiry).toLocaleString() : '—'}</p><p>Plan reference: {member.subscriptionPlanId || '—'}</p><p>Override: {member.overrideEnabled ? 'Enabled' : 'Not enabled'}</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Admin actions</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Tier</Label><Input value={tierDraft} onChange={(e) => setTierDraft(e.target.value)} /><Label>Status</Label><Input value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} /><Label>Expiry date</Label><Input type="date" value={expiryDraft} onChange={(e) => setExpiryDraft(e.target.value)} /><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for membership changes" /></div><div className="space-y-2"><Label>Override reason</Label><Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} /><Label>Override end date</Label><Input type="date" value={overrideEndDate} onChange={(e) => setOverrideEndDate(e.target.value)} /><div className="flex flex-wrap gap-2 pt-2"><Button disabled={saving} onClick={saveMembership}>Save tier/status</Button><Button disabled={saving} variant="outline" onClick={() => { setStatusDraft('suspended'); void saveMembership(); }}>Suspend access</Button><Button disabled={saving} variant="outline" onClick={() => { setStatusDraft('active'); void saveMembership(); }}>Reactivate access</Button><Button disabled={saving} variant="secondary" onClick={() => saveOverride(true)}>Apply override</Button><Button disabled={saving} variant="destructive" onClick={() => saveOverride(false)}>Remove override</Button></div></div></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Internal notes</CardTitle></CardHeader><CardContent className="space-y-4"><form onSubmit={submitNote} className="space-y-2"><Textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add admin-only note" /><Button type="submit" disabled={saving || !noteInput.trim()}>Add note</Button></form><div className="space-y-2">{notes.length === 0 ? <p className="text-muted-foreground">No notes recorded.</p> : notes.map((note) => <div key={note.id} className="rounded border p-2 text-sm"><p>{note.note}</p><p className="text-xs text-muted-foreground">{note.authorName || note.authorUserId} • {new Date(note.createdAt).toLocaleString()}</p></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>History & activity</CardTitle></CardHeader><CardContent className="space-y-2">{history.length === 0 ? <p className="text-muted-foreground">No history yet.</p> : history.map((item) => <div key={item.id} className="rounded border p-2 text-sm"><p>{item.oldTier || '—'} → {item.newTier || '—'} | {item.oldStatus || '—'} → {item.newStatus || '—'}</p><p className="text-xs text-muted-foreground">{item.reason || 'No reason'} • {item.changedBy} • {new Date(item.changedAt).toLocaleString()}</p></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
