'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { MemberCRMRow } from '@/lib/definitions';
import { buildMembershipMetrics } from '@/lib/membership-crm';

const PAGE_SIZE = 20;

export default function MemberAdministrationPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberCRMRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'joinDate' | 'lastLogin'>('joinDate');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({
          search,
          status: statusFilter,
          tier: tierFilter,
          role: roleFilter,
          sortBy,
        });

        const response = await fetch(`/api/admin/membership/members?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Failed loading members');
        setMembers(payload.data as MemberCRMRow[]);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to load members', description: error instanceof Error ? error.message : 'Please retry.' });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [auth, roleFilter, search, sortBy, statusFilter, tierFilter, toast]);

  const metrics = useMemo(() => buildMembershipMetrics(members, []), [members]);
  const paginated = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

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
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="lapsed">Lapsed</SelectItem></SelectContent></Select>
            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger><SelectContent><SelectItem value="all">All tiers</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent></Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
            <Select value={sortBy} onValueChange={(v: 'joinDate' | 'lastLogin') => { setSortBy(v); setPage(1); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="joinDate">Sort by join date</SelectItem><SelectItem value="lastLogin">Sort by last login</SelectItem></SelectContent></Select>
          </div>

          {loading ? <p className="text-muted-foreground">Loading members…</p> : members.length === 0 ? <p className="text-muted-foreground">No members match your filters.</p> : (
            <div className="space-y-2">
              {paginated.map((member) => (
                <Link key={member.id} href={`/admin/membership/member-administration/${member.id}`} className="grid gap-2 rounded border p-3 md:grid-cols-9 hover:bg-muted/50">
                  <div className="md:col-span-2"><p className="font-medium">{member.name}</p><p className="text-sm text-muted-foreground">{member.email}</p></div>
                  <div>{member.role}</div>
                  <div><Badge variant="outline">{member.membershipTier}</Badge></div>
                  <div><Badge variant={member.membershipStatus === 'active' ? 'default' : 'secondary'}>{member.membershipStatus}</Badge></div>
                  <div>{new Date(member.joinDate).toLocaleDateString()}</div>
                  <div>{member.accessExpiry ? new Date(member.accessExpiry).toLocaleDateString() : '—'}</div>
                  <div>{member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : '—'}</div>
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
