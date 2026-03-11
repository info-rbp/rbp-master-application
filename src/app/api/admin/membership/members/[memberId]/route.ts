import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthContext } from '@/lib/server-auth';
import { getMemberDetailForAdmin, updateMemberMembershipState } from '@/lib/admin-membership-crm';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId } = await context.params;
  const member = await getMemberDetailForAdmin(memberId);
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ data: member });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  const auth = await getRequestAuthContext(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { memberId } = await context.params;
  const payload = await request.json();
  const membershipTier = String(payload.membershipTier ?? '').trim();
  const membershipStatus = String(payload.membershipStatus ?? '').trim();

  if (!membershipTier || !membershipStatus) {
    return NextResponse.json({ error: 'membershipTier and membershipStatus are required' }, { status: 400 });
  }

  const member = await updateMemberMembershipState(memberId, {
    membershipTier,
    membershipStatus,
    membershipExpiresAt: payload.membershipExpiresAt ? String(payload.membershipExpiresAt) : null,
    reason: payload.reason ? String(payload.reason) : undefined,
  }, {
    userId: auth.userId,
    email: auth.email,
  });

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ data: member });
}
