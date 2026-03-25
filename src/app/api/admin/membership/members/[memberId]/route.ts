import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationError, requireAdminActionRequestContext } from '@/lib/server-auth';
import { getMemberDetailForAdmin, updateMemberMembershipState } from '@/lib/admin-membership-crm';
import { MEMBERSHIP_TIERS, type MembershipStatus } from '@/lib/definitions';
import { readJsonBody } from '@/lib/http';

export async function GET(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  try {
    await requireAdminActionRequestContext(request, 'admin.membership.read');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { memberId } = await context.params;
  const member = await getMemberDetailForAdmin(memberId);
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ data: member });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ memberId: string }> }) {
  let auth;
  try {
    auth = await requireAdminActionRequestContext(request, 'admin.membership.manage');
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { memberId } = await context.params;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const payload = parsed.data;
  const membershipTier = String(payload.membershipTier ?? '').trim();
  const membershipStatus = String(payload.membershipStatus ?? '').trim().toLowerCase();

  const validStatuses: MembershipStatus[] = ['active', 'canceled', 'past_due', 'unpaid', 'pending', 'paused', 'suspended', 'lapsed'];
  if (!MEMBERSHIP_TIERS.includes(membershipTier as (typeof MEMBERSHIP_TIERS)[number]) || !validStatuses.includes(membershipStatus as MembershipStatus)) {
    return NextResponse.json({ error: 'membershipTier and membershipStatus are invalid' }, { status: 400 });
  }

  const member = await updateMemberMembershipState(memberId, {
    membershipTier: membershipTier as (typeof MEMBERSHIP_TIERS)[number],
    membershipStatus: membershipStatus as MembershipStatus,
    membershipExpiresAt: payload.membershipExpiresAt ? String(payload.membershipExpiresAt) : null,
    reason: payload.reason ? String(payload.reason) : undefined,
  }, {
    userId: auth.userId,
    email: auth.email,
  });

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ data: member });
}
