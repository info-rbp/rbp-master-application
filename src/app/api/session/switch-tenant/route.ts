import { NextRequest, NextResponse } from 'next/server';
import { switchTenantContext } from '@/lib/platform/session';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { tenantId?: string; workspaceId?: string } | null;
  if (!body?.tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const session = await switchTenantContext({ tenantId: body.tenantId, workspaceId: body.workspaceId });
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Tenant switch failed' }, { status: 403 });
  }
}
