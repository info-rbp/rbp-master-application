import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { listSavedItems, saveItem } from '@/lib/member-dashboard';
import { readJsonBody } from '@/lib/http';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ records: await listSavedItems(auth.userId) });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;
  if (!body.title || !body.itemPath || !body.itemType) {
    return NextResponse.json({ error: 'title, itemPath and itemType are required' }, { status: 400 });
  }
  const id = await saveItem(auth.userId, {
    title: String(body.title),
    itemPath: String(body.itemPath),
    itemType: body.itemType,
    itemId: body.itemId ? String(body.itemId) : null,
  });
  return NextResponse.json({ id }, { status: 201 });
}
