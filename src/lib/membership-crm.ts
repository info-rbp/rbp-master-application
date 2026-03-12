import type { MemberCRMRow, MembershipHistoryItem, MemberCRMMetricSummary } from './definitions';

export function normalizeMemberRow(input: {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  membershipTier?: string | null;
  membershipStatus?: string;
  createdAt?: string;
  membershipExpiresAt?: string | null;
  lastLoginAt?: string | null;
  emailVerified?: boolean;
  overrideEnabled?: boolean;
  squareSubscriptionStatus?: string | null;
  squareSubscriptionId?: string | null;
  squareCustomerId?: string | null;
  membershipPlanCode?: string | null;
  billingCycle?: string | null;
  activePromotionGrantEndAt?: string | null;
}): MemberCRMRow {
  return {
    id: input.id,
    name: input.name?.trim() || 'Unnamed member',
    email: input.email?.trim() || 'No email',
    role: input.role?.trim() || 'member',
    membershipTier: input.membershipTier?.trim() || 'none',
    membershipStatus: input.membershipStatus?.trim() || 'pending',
    joinDate: input.createdAt || new Date(0).toISOString(),
    accessExpiry: input.membershipExpiresAt || null,
    lastLogin: input.lastLoginAt || null,
    emailVerified: Boolean(input.emailVerified),
    overrideEnabled: Boolean(input.overrideEnabled),
    squareSubscriptionStatus: input.squareSubscriptionStatus ?? null,
    squareSubscriptionId: input.squareSubscriptionId ?? null,
    squareCustomerId: input.squareCustomerId ?? null,
    membershipPlanCode: input.membershipPlanCode ?? null,
    billingCycle: input.billingCycle ?? null,
    activePromotionGrantEndAt: input.activePromotionGrantEndAt ?? null,
  };
}

export function buildMembershipHistoryItem(params: {
  memberId: string;
  oldTier?: string | null;
  newTier?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  reason?: string;
  changedBy: string;
  source?: 'admin' | 'manual' | 'provider_sync' | 'system';
}): Omit<MembershipHistoryItem, 'id'> {
  return {
    memberId: params.memberId,
    oldTier: params.oldTier ?? null,
    newTier: params.newTier ?? null,
    oldStatus: params.oldStatus ?? null,
    newStatus: params.newStatus ?? null,
    reason: params.reason?.trim() || null,
    changedBy: params.changedBy,
    changedAt: new Date().toISOString(),
    source: params.source ?? 'admin',
  };
}

export function buildMembershipMetrics(rows: MemberCRMRow[], history: MembershipHistoryItem[]): MemberCRMMetricSummary {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  return {
    totalMembers: rows.length,
    activeMembers: rows.filter((row) => row.membershipStatus === 'active').length,
    pendingMembers: rows.filter((row) => row.membershipStatus === 'pending').length,
    lapsedMembers: rows.filter((row) => row.membershipStatus === 'lapsed').length,
    suspendedMembers: rows.filter((row) => row.membershipStatus === 'suspended').length,
    membersOnOverride: rows.filter((row) => row.overrideEnabled).length,
    recentSignups: rows.filter((row) => new Date(row.joinDate).getTime() >= sevenDaysAgo).length,
    recentStatusChanges: history.filter((item) => new Date(item.changedAt).getTime() >= sevenDaysAgo).length,
  };
}
