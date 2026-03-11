import { NextRequest, NextResponse } from 'next/server';
import { addMemberNote, listMemberNotes } from '@/lib/admin-membership-crm';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId } = await context.params;
  const notes = await listMemberNotes(memberId);
  return NextResponse.json({ data: notes });
}

export async function POST(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const note = String(payload.note ?? '').trim();
  if (!note) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 });
  }

  const { memberId } = await context.params;
  const created = await addMemberNote(memberId, note, {
    userId: auth.userId,
    email: auth.email,
    name: auth.email,
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
