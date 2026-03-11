import { NextRequest, NextResponse } from 'next/server';
import { applyMemberOverride, getMemberDetailForAdmin, removeMemberOverride } from '@/lib/admin-membership-crm';
import { getRequestAuthContext } from '@/lib/server-auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const reason = String(payload.reason ?? '').trim();
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const { memberId } = await context.params;
  const override = await applyMemberOverride(memberId, reason, payload.endDate ? String(payload.endDate) : null, {
    userId: auth.userId,
    email: auth.email,
  });

  const member = await getMemberDetailForAdmin(memberId);
  return NextResponse.json({ data: { override, member } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId } = await context.params;
  await removeMemberOverride(memberId, { userId: auth.userId, email: auth.email });
  const member = await getMemberDetailForAdmin(memberId);
  return NextResponse.json({ data: member });
}
