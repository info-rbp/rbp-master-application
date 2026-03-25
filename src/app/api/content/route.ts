
import { NextRequest, NextResponse } from 'next/server';
import { createContentDraft } from '@/lib/content-service';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
  }

  try {
    const content = await createContentDraft(auth.userId, title, body);
    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create content draft' }, { status: 500 });
  }
}
