import { NextRequest, NextResponse } from 'next/server';
import { listMembershipHistory } from '@/lib/admin-membership-crm';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId } = await context.params;
  const history = await listMembershipHistory(memberId);
  return NextResponse.json({ data: history });
}
