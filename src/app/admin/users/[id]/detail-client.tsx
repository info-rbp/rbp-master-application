'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { UserAdminActivity, UserProfile } from '@/lib/definitions';
import { saveUserAccountStatus, saveUserProfileFields, saveUserRole } from '../actions';

export function UserDetailClient({ initialUser, activity }: { initialUser: UserProfile; activity: UserAdminActivity }) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name ?? '');
  const [phone, setPhone] = useState(initialUser.phone ?? '');
  const [company, setCompany] = useState(initialUser.company ?? '');
  const [role, setRole] = useState(initialUser.role);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onSaveProfile = () => startTransition(async () => {
    const saved = await saveUserProfileFields(user.uid, { name, phone, company });
    if (!saved) {
      toast({ title: 'Unable to save profile', variant: 'destructive' });
      return;
    }
    setUser(saved);
    toast({ title: 'Profile saved' });
  });

  const onSaveRole = () => startTransition(async () => {
    const saved = await saveUserRole(user.uid, role);
    if (!saved) {
      toast({ title: 'Unable to update role', variant: 'destructive' });
      return;
    }
    setUser(saved);
    toast({ title: 'Role updated' });
  });

  const onSetStatus = (status: 'active' | 'suspended') => startTransition(async () => {
    if (status === 'suspended' && !window.confirm('Suspend this account?')) return;
    const saved = await saveUserAccountStatus(user.uid, status);
    if (!saved) {
      toast({ title: 'Unable to update account status', variant: 'destructive' });
      return;
    }
    setUser(saved);
    toast({ title: `Account ${status === 'active' ? 'reactivated' : 'suspended'}` });
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Detail</h2>
        <Button asChild variant="outline"><Link href="/admin/users">Back to users</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Profile summary</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><strong>Name:</strong> {user.name || '—'}</p><p><strong>Email:</strong> {user.email || '—'}</p>
          <p><strong>Phone:</strong> {user.phone || '—'}</p><p><strong>Company:</strong> {user.company || '—'}</p>
          <p><strong>Role:</strong> {user.role}</p><p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleString()}</p>
          <p><strong>Last login:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</p><p><strong>Email verification:</strong> {user.emailVerified ? 'Verified' : 'Unverified'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account summary</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p><strong>Account status:</strong> <Badge variant={user.accountStatus === 'suspended' ? 'destructive' : 'outline'}>{user.accountStatus ?? 'active'}</Badge></p>
          <p><strong>Membership tier:</strong> {user.membershipTier ?? 'none'}</p>
          <p><strong>Membership status:</strong> {user.membershipStatus ?? 'pending'}</p>
          <p><strong>Access expiry:</strong> {user.accessExpiry ? new Date(user.accessExpiry).toLocaleDateString() : '—'}</p>
          <p><strong>Square customer:</strong> {user.squareCustomerId || '—'}</p>
          <p><strong>Square subscription:</strong> {user.squareSubscriptionId || '—'}</p>
          <p><strong>Last payment status:</strong> {user.lastPaymentStatus || '—'}</p>
          <p><strong>Last payment at:</strong> {user.lastPaymentAt ? new Date(user.lastPaymentAt).toLocaleString() : '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Admin actions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} />
            <Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} />
            <Button disabled={isPending} onClick={onSaveProfile}>Save profile fields</Button>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select className="w-full rounded-md border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending} onClick={onSaveRole}>Save role</Button>
              <Button disabled={isPending} variant="outline" onClick={() => onSetStatus('active')}>Reactivate</Button>
              <Button disabled={isPending} variant="destructive" onClick={() => onSetStatus('suspended')}>Suspend</Button>
            </div>
            <Button asChild variant="secondary"><Link href={`/admin/membership/member-administration/${user.uid}`}>Open membership CRM</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent history and activity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><p className="mb-2 text-sm font-medium">Membership changes</p>{activity.membershipHistory.length === 0 ? <p className="text-sm text-muted-foreground">No membership history.</p> : activity.membershipHistory.map((item) => <p key={item.id} className="text-xs">{item.oldStatus ?? '—'} → {item.newStatus ?? '—'} ({new Date(item.changedAt).toLocaleString()})</p>)}</div>
          <div><p className="mb-2 text-sm font-medium">Admin audit events</p>{activity.auditEvents.length === 0 ? <p className="text-sm text-muted-foreground">No admin audit events.</p> : activity.auditEvents.map((item) => <p key={item.id} className="text-xs">{item.actionType} • {new Date(item.createdAt).toLocaleString()}</p>)}</div>
          <div><p className="mb-2 text-sm font-medium">Notifications</p>{activity.notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications.</p> : activity.notifications.map((item) => <p key={item.id} className="text-xs">{item.title} • {new Date(item.createdAt).toLocaleString()}</p>)}</div>
          <div><p className="mb-2 text-sm font-medium">Analytics events</p>{activity.analyticsEvents.length === 0 ? <p className="text-sm text-muted-foreground">No analytics events.</p> : activity.analyticsEvents.map((item) => <p key={item.id} className="text-xs">{item.eventType} • {new Date(item.createdAt).toLocaleString()}</p>)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
