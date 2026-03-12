'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { MemberCRMMetricSummary, MemberCRMRow } from '@/lib/definitions';

const PAGE_SIZE = 20;

const emptyMetrics: MemberCRMMetricSummary = {
  totalMembers: 0,
  activeMembers: 0,
  pendingMembers: 0,
  lapsedMembers: 0,
  suspendedMembers: 0,
  membersOnOverride: 0,
  recentSignups: 0,
  recentStatusChanges: 0,
};

export default function MemberAdministrationPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberCRMRow[]>([]);
  const [metrics, setMetrics] = useState<MemberCRMMetricSummary>(emptyMetrics);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'joinDate' | 'lastLogin'>('joinDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({
          search,
          status: statusFilter,
          tier: tierFilter,
          role: roleFilter,
          sortBy,
          sortDir,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        const response = await fetch(`/api/admin/membership/members?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Failed loading members');
        setMembers(payload.data.members.items as MemberCRMRow[]);
        setTotalPages(Number(payload.data.members.totalPages ?? 1));
        setTotalMembers(Number(payload.data.members.total ?? 0));
        setMetrics(payload.data.metrics as MemberCRMMetricSummary);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Please retry.';
        setError(message);
        toast({ variant: 'destructive', title: 'Failed to load members', description: message });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [auth, page, roleFilter, search, sortBy, sortDir, statusFilter, tierFilter, toast]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Membership CRM</h1>
        <Button asChild variant="outline"><Link href="/admin/membership/plans">Manage plans</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(metrics).map(([key, value]) => (
          <Card key={key}><CardHeader className="pb-2"><CardTitle className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Members ({totalMembers})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-6">
            <Input placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="lapsed">Lapsed</SelectItem></SelectContent></Select>
            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger><SelectContent><SelectItem value="all">All tiers</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="none">None</SelectItem></SelectContent></Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
            <Select value={sortBy} onValueChange={(v: 'joinDate' | 'lastLogin') => { setSortBy(v); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="joinDate">Sort by join date</SelectItem><SelectItem value="lastLogin">Sort by last login</SelectItem></SelectContent></Select>
            <Select value={sortDir} onValueChange={(v: 'asc' | 'desc') => { setSortDir(v); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Newest first</SelectItem><SelectItem value="asc">Oldest first</SelectItem></SelectContent></Select>
          </div>

          {loading ? <p className="text-muted-foreground">Loading members…</p> : error ? <p className="text-destructive">{error}</p> : members.length === 0 ? <p className="text-muted-foreground">No members match your filters.</p> : (
            <div className="space-y-2">
              {members.map((member) => (
                <Link key={member.id} href={`/admin/membership/member-administration/${member.id}`} className="grid gap-2 rounded border p-3 md:grid-cols-10 hover:bg-muted/50">
                  <div className="md:col-span-2"><p className="font-medium">{member.name}</p><p className="text-sm text-muted-foreground">{member.email}</p></div>
                  <div>{member.role}</div>
                  <div><Badge variant="outline">{member.membershipTier}</Badge></div>
                  <div><Badge variant={member.membershipStatus === 'active' ? 'default' : 'secondary'}>{member.membershipStatus}</Badge></div>
                  <div>{new Date(member.joinDate).toLocaleDateString()}</div>
                  <div>{member.accessExpiry ? new Date(member.accessExpiry).toLocaleDateString() : '—'}</div>
                  <div>{member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : '—'}</div>
                  <div>{member.emailVerified ? 'Verified' : 'Unverified'}</div>
                  <div>{member.squareSubscriptionStatus ? <Badge variant="outline">Square {member.squareSubscriptionStatus}</Badge> : '—'}</div>
                  <div>{member.overrideEnabled ? <Badge variant="destructive">Override</Badge> : '—'}</div>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="space-x-2"><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
