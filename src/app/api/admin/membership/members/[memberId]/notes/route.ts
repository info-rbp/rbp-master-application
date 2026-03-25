import { NextRequest, NextResponse } from 'next/server';
import { addMemberNote, listMemberNotes } from '@/lib/admin-membership-crm';
import { AuthorizationError, requireAdminActionRequestContext } from '@/lib/server-auth';
import { readJsonBody } from '@/lib/http';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  try {
    await requireAdminActionRequestContext(request, 'admin.membership.read');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { memberId } = await context.params;
  const notes = await listMemberNotes(memberId);
  return NextResponse.json({ data: notes });
}

export async function POST(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  let auth;
  try {
    auth = await requireAdminActionRequestContext(request, 'admin.membership.notes.manage');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const payload = parsed.data;
  const note = String(payload.note ?? '').trim();
  if (!note) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 });
  }

  const { memberId } = await context.params;
  try {
    const created = await addMemberNote(memberId, note, {
      userId: auth.userId,
      email: auth.email,
      name: auth.email,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create note';
    const status = message === 'Member not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
