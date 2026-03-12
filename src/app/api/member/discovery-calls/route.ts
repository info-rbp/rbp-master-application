import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { canBookDiscoveryCall, canBookStrategicCheckup } from '@/lib/entitlements';
import { createDiscoveryCall, getMemberOverview, listDiscoveryCalls } from '@/lib/member-dashboard';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const records = await listDiscoveryCalls(auth.userId);
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const callType = body.callType === 'strategic_checkup' ? 'strategic_checkup' : 'discovery_call';
  const overview = await getMemberOverview(auth.userId);
  if (callType === 'strategic_checkup' && !canBookStrategicCheckup(overview.tier)) {
    return NextResponse.json({ error: 'Strategic check-ups are Premium-only.' }, { status: 403 });
  }
  if (callType === 'discovery_call' && !canBookDiscoveryCall(overview.tier)) {
    return NextResponse.json({ error: 'Discovery calls are not included in this tier.' }, { status: 403 });
  }
  const id = await createDiscoveryCall(auth.userId, { callType, preferredDateTime: body.preferredDateTime ?? null, requestedWindow: body.requestedWindow ?? null, notes: body.notes ?? null });
  return NextResponse.json({ id }, { status: 201 });
}
