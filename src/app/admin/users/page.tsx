import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getUsers, getUsersForAdmin } from '@/lib/data';

type SearchParams = Record<string, string | string[] | undefined>;

const readParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  try {
    const allUsers = await getUsersForAdmin();
    const roles = [...new Set(allUsers.map((x) => x.role).filter(Boolean))].sort();
    const tiers = [...new Set(allUsers.map((x) => x.membershipTier ?? 'none'))].sort();
    const statuses = [...new Set(allUsers.map((x) => x.membershipStatus ?? 'pending'))].sort();

    const page = Number(readParam(params, 'page') ?? 1);
    const result = await getUsers({
      query: readParam(params, 'query') ?? '',
      role: readParam(params, 'role') ?? 'all',
      membershipStatus: readParam(params, 'membershipStatus') ?? 'all',
      membershipTier: readParam(params, 'membershipTier') ?? 'all',
      verification: (readParam(params, 'verification') as 'all' | 'verified' | 'unverified' | undefined) ?? 'all',
      accountStatus: (readParam(params, 'accountStatus') as 'all' | 'active' | 'suspended' | undefined) ?? 'all',
      sortBy: (readParam(params, 'sortBy') as 'createdAt' | 'lastLoginAt' | undefined) ?? 'createdAt',
      sortDir: (readParam(params, 'sortDir') as 'asc' | 'desc' | undefined) ?? 'desc',
      page,
      pageSize: 20,
    });

    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">User Administration</h2>
        <Card>
          <CardHeader>
            <CardTitle>Search and filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-4" method="get">
              <Input name="query" placeholder="Search by name or email" defaultValue={readParam(params, 'query') ?? ''} />
              <select name="role" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'role') ?? 'all'}>
                <option value="all">All roles</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select name="membershipStatus" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'membershipStatus') ?? 'all'}>
                <option value="all">All membership statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select name="membershipTier" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'membershipTier') ?? 'all'}>
                <option value="all">All tiers</option>
                {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
              </select>
              <select name="verification" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'verification') ?? 'all'}>
                <option value="all">Any verification</option>
                <option value="verified">Verified only</option>
                <option value="unverified">Unverified only</option>
              </select>
              <select name="accountStatus" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'accountStatus') ?? 'all'}>
                <option value="all">All account states</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <select name="sortBy" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'sortBy') ?? 'createdAt'}>
                <option value="createdAt">Sort by join date</option>
                <option value="lastLoginAt">Sort by last login</option>
              </select>
              <select name="sortDir" className="rounded-md border px-3 py-2" defaultValue={readParam(params, 'sortDir') ?? 'desc'}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
              <Button type="submit">Apply filters</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({result.total})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.items.length === 0 ? <p className="text-sm text-muted-foreground">No users matched your filters.</p> : result.items.map((user) => (
              <Link key={user.uid} href={`/admin/users/${user.uid}`} className="grid gap-2 rounded border p-3 text-sm hover:bg-muted/50 md:grid-cols-10">
                <div className="font-medium md:col-span-2">{user.name || 'Unnamed'}</div>
                <div className="md:col-span-2">{user.email}</div>
                <div><Badge variant="outline">{user.role}</Badge></div>
                <div>{user.membershipTier ?? 'none'}</div>
                <div>{user.membershipStatus ?? 'pending'}</div>
                <div>{user.emailVerified ? 'Verified' : 'Unverified'}</div>
                <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                <div>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}</div>
                <div>{user.accountStatus ?? 'active'}</div>
                <div>{user.squareSubscriptionId || user.squareCustomerId ? 'Square linked' : '—'}</div>
              </Link>
            ))}
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">Page {result.page} of {result.totalPages}</span>
              <div className="flex gap-2">
                {result.page > 1 ? <a className="text-sm underline" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] ?? '' : v ?? ''])), page: String(result.page - 1) }).toString()}`}>Previous</a> : null}
                {result.page < result.totalPages ? <a className="text-sm underline" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] ?? '' : v ?? ''])), page: String(result.page + 1) }).toString()}`}>Next</a> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">User Administration</h2>
        <Alert variant="destructive">
          <AlertTitle>Unable to load users</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Unexpected error loading admin users.'}</AlertDescription>
        </Alert>
      </div>
    );
  }
}
