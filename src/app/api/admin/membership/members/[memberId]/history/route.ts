import { NextRequest, NextResponse } from 'next/server';
import { listMembershipHistory } from '@/lib/admin-membership-crm';
import { AuthorizationError, requireAdminActionRequestContext } from '@/lib/server-auth';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  try {
    await requireAdminActionRequestContext(request, 'admin.membership.read');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { memberId } = await context.params;
  const history = await listMembershipHistory(memberId);
  return NextResponse.json({ data: history });
}
