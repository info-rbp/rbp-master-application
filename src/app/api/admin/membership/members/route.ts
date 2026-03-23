import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAdminActionRequestContext } from '@/lib/server-auth';
import { getMembershipCRMOverview } from '@/lib/admin-membership-crm';

export async function GET(request: NextRequest) {
  try {
    await requireAdminActionRequestContext(request, 'admin.membership.read');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
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
