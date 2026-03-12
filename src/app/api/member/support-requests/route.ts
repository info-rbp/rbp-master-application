import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { canAccessImplementationSupport } from '@/lib/entitlements';
import { createSupportRequest, getMemberOverview, listSupportRequests } from '@/lib/member-dashboard';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const records = await listSupportRequests(auth.userId);
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const overview = await getMemberOverview(auth.userId);
  if (!canAccessImplementationSupport(overview.tier)) {
    return NextResponse.json({ error: 'Implementation support is Premium-only.' }, { status: 403 });
  }
  if (!body.description || typeof body.description !== 'string') {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }
  const requestType = body.requestType === 'general_support' ? 'general_support' : 'implementation_support';
  const id = await createSupportRequest(auth.userId, { requestType, description: body.description, priority: body.priority });
  return NextResponse.json({ id }, { status: 201 });
}
