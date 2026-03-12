import { NextRequest, NextResponse } from 'next/server';
import { evaluateProtectedAction, type ProtectedActionInput } from '@/lib/protected-actions';
import { getRequestAuthContext } from '@/lib/server-auth';
import { readJsonBody } from '@/lib/http';

export async function POST(request: NextRequest) {
  const parsed = await readJsonBody<Partial<ProtectedActionInput>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const payload = parsed.data;
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
