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
  overrideEnabled?: boolean;
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
    overrideEnabled: Boolean(input.overrideEnabled),
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
