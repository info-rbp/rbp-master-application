import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { getMemberOverview } from '@/lib/member-dashboard';
import { createCallWorkflow, listMemberWorkflows } from '@/lib/service-workflows';
import { readJsonBody } from '@/lib/http';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const [discovery, strategic] = await Promise.all([
    listMemberWorkflows(auth.userId, 'discovery_call'),
    listMemberWorkflows(auth.userId, 'strategic_checkup'),
  ]);
  return NextResponse.json({ ok: true, records: [...discovery, ...strategic].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
  const workflowType = body.callType === 'strategic_checkup' ? 'strategic_checkup' : 'discovery_call';
  const overview = await getMemberOverview(auth.userId);

  const result = await createCallWorkflow({
    memberId: auth.userId,
    memberName: overview.user?.name ?? null,
    tier: overview.tier,
    workflowType,
    preferredDateTime: body.preferredDateTime ?? null,
    requestedWindow: body.requestedWindow ?? null,
    notes: body.notes ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code, error: result.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
