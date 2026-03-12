import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { getMemberOverview } from '@/lib/member-dashboard';
import { createImplementationSupportWorkflow, listMemberWorkflows } from '@/lib/service-workflows';
import { readJsonBody } from '@/lib/http';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const records = await listMemberWorkflows(auth.userId, 'implementation_support');
  return NextResponse.json({ ok: true, records });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
  if (!body.description || typeof body.description !== 'string') {
    return NextResponse.json({ ok: false, error: 'description is required' }, { status: 400 });
  }

  const overview = await getMemberOverview(auth.userId);
  const result = await createImplementationSupportWorkflow({
    memberId: auth.userId,
    memberName: overview.user?.name ?? null,
    tier: overview.tier,
    description: body.description,
    category: body.category ?? null,
    priority: body.priority,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code, error: result.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
