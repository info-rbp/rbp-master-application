
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const action = searchParams.get('action') || undefined;
  const targetId = searchParams.get('targetId') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

  try {
    const logs = await getAuditLogs({ userId, action, targetId, limit });
    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}
