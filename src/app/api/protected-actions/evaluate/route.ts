import { NextRequest, NextResponse } from 'next/server';
import { evaluateProtectedAction, type ProtectedActionInput } from '@/lib/protected-actions';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Partial<ProtectedActionInput>;
  if (!payload.actionType) {
    return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });
  }

  const auth = await getRequestAuthContext(request);
  const result = await evaluateProtectedAction({
    actionType: payload.actionType,
    slug: payload.slug,
    returnTo: payload.returnTo,
  }, auth);

  return NextResponse.json(result, { status: result.allowed ? 200 : 403 });
}
