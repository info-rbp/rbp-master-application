import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { listSavedItems, saveItem } from '@/lib/member-dashboard';

export async function GET() {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ records: await listSavedItems(auth.userId) });
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
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
