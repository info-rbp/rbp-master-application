import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { createCustomisationRequest, listCustomisationRequests, getMemberOverview } from '@/lib/member-dashboard';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const records = await listCustomisationRequests(auth.userId);
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.requestDescription || typeof body.requestDescription !== 'string') {
    return NextResponse.json({ error: 'requestDescription is required' }, { status: 400 });
  }
  const overview = await getMemberOverview(auth.userId);
  try {
    const id = await createCustomisationRequest(auth.userId, { requestDescription: body.requestDescription, relatedResourceId: body.relatedResourceId ?? null, priority: body.priority }, overview.tier);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to submit request' }, { status: 403 });
  }
}
