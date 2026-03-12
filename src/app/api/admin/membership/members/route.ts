import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthContext } from '@/lib/server-auth';
import { getMembershipCRMOverview } from '@/lib/admin-membership-crm';

export async function GET(request: NextRequest) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const payload = await getMembershipCRMOverview({
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? 'all',
    tier: searchParams.get('tier') ?? 'all',
    role: searchParams.get('role') ?? 'all',
    sortBy: (searchParams.get('sortBy') as 'joinDate' | 'lastLogin' | null) ?? 'joinDate',
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc' | null) ?? 'desc',
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Number(searchParams.get('pageSize') ?? 20),
  });

  return NextResponse.json({ data: payload });
}
