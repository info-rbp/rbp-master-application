import { firestore } from '@/firebase/server';
import { logAuditEvent, logMembershipHistory } from '@/lib/audit';
import { safeLogAnalyticsEvent } from '@/lib/analytics';
import type {
  MemberCRMOverview,
  MemberCRMRow,
  MemberDetail,
  MemberListResult,
  MemberNote,
  MemberOverride,
  MembershipHistoryItem,
  MembershipStatus,
  MembershipTier,
} from '@/lib/definitions';
import { filterMembersForAdminView, type MemberListFilters } from '@/lib/admin-membership-crm-client';
import { buildMembershipMetrics, normalizeMemberRow } from '@/lib/membership-crm';

type FirestoreDoc = FirebaseFirestore.DocumentData;

export type AdminActor = {
  userId: string;
  email?: string;
  name?: string;
};

export type MembershipUpdateInput = {
  membershipTier: MembershipTier;
  membershipStatus: MembershipStatus;
  membershipExpiresAt?: string | null;
  reason?: string;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function hydrateMemberDetail(userId: string, data: FirestoreDoc, overrideEnabled: boolean): MemberDetail {
  const normalized = normalizeMemberRow({
    id: userId,
    name: data.name,
    email: data.email,
    role: data.role,
    membershipTier: data.membershipTier,
    membershipStatus: data.membershipStatus,
    createdAt: toIso(data.createdAt) ?? new Date(0).toISOString(),
    membershipExpiresAt: toIso(data.membershipExpiresAt),
    lastLoginAt: toIso(data.lastLoginAt),
    emailVerified: Boolean(data.emailVerified),
    overrideEnabled,
    squareSubscriptionStatus: data.squareSubscriptionStatus ?? null,
    squareSubscriptionId: data.squareSubscriptionId ?? null,
    squareCustomerId: data.squareCustomerId ?? null,
    membershipPlanCode: data.membershipPlanCode ?? null,
    billingCycle: data.billingCycle ?? null,
    activePromotionGrantEndAt: toIso(data.activePromotionGrantEndAt),
  });

  return {
    ...normalized,
    company: data.company ?? null,
    phone: data.phone ?? null,
    subscriptionPlanId: data.subscriptionPlanId ?? null,
    lastPaymentStatus: data.lastPaymentStatus ?? null,
    lastPaymentAt: toIso(data.lastPaymentAt),
    squareLocationId: data.squareLocationId ?? null,
    membershipPlanCode: data.membershipPlanCode ?? null,
    billingCycle: data.billingCycle ?? null,
    activePromotionGrantEndAt: toIso(data.activePromotionGrantEndAt),
  };
}

async function assertMemberExists(memberId: string) {
  const userSnap = await firestore.collection('users').doc(memberId).get();
  return userSnap.exists;
}

export async function listMembersForAdmin(filters: MemberListFilters = {}): Promise<MemberListResult> {
  const [usersSnapshot, overridesSnapshot] = await Promise.all([
    firestore.collection('users').get(),
    firestore.collection('member_overrides').where('enabled', '==', true).get(),
  ]);

  const overrideMap = new Map<string, boolean>();
  overridesSnapshot.forEach((overrideDoc) => {
    const data = overrideDoc.data();
    if (typeof data.memberId === 'string') {
      overrideMap.set(data.memberId, Boolean(data.enabled));
    }
  });

  return filterMembersForAdminView(
    usersSnapshot.docs.map((doc) => hydrateMemberDetail(doc.id, doc.data(), Boolean(overrideMap.get(doc.id)))),
    filters,
  );
}

export async function getMemberDetailForAdmin(memberId: string): Promise<MemberDetail | null> {
  const [userSnap, overrideSnap] = await Promise.all([
    firestore.collection('users').doc(memberId).get(),
    firestore.collection('member_overrides').where('memberId', '==', memberId).limit(1).get(),
  ]);

  if (!userSnap.exists) return null;
  const overrideEnabled = !overrideSnap.empty ? Boolean(overrideSnap.docs[0].data().enabled) : false;
  return hydrateMemberDetail(userSnap.id, userSnap.data() ?? {}, overrideEnabled);
}

export async function getMembershipCRMOverview(filters: MemberListFilters = {}): Promise<MemberCRMOverview> {
  const members = await listMembersForAdmin(filters);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const historySnapshot = await firestore
    .collection('membership_history')
    .where('changedAt', '>=', sevenDaysAgo)
    .orderBy('changedAt', 'desc')
    .get();

  const history: MembershipHistoryItem[] = historySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      memberId: String(data.userId ?? data.memberId ?? ''),
      oldTier: data.previousTier ?? null,
      newTier: data.newTier ?? null,
      oldStatus: data.previousStatus ?? null,
      newStatus: data.newStatus ?? null,
      reason: data.reason ?? null,
      changedBy: String(data.changedBy ?? 'unknown'),
      changedAt: toIso(data.changedAt) ?? new Date(0).toISOString(),
      source: data.source ?? 'admin',
    };
  });

  return {
    members,
    metrics: buildMembershipMetrics(members.items, history),
  };
}

export async function updateMemberMembershipState(memberId: string, input: MembershipUpdateInput, actor: AdminActor) {
  const userRef = firestore.collection('users').doc(memberId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return null;

  const beforeData = userSnap.data() ?? {};
  const oldTier = String(beforeData.membershipTier ?? 'none');
  const oldStatus = String(beforeData.membershipStatus ?? 'pending');

  const nextTier = input.membershipTier.trim() || oldTier;
  const nextStatus = input.membershipStatus.trim() || oldStatus;
  const nextExpiresAt = input.membershipExpiresAt ? new Date(input.membershipExpiresAt).toISOString() : null;

  await userRef.update({
    membershipTier: nextTier,
    membershipStatus: nextStatus,
    membershipExpiresAt: nextExpiresAt,
    updatedAt: new Date(),
  });

  await logMembershipHistory({
    userId: memberId,
    previousTier: oldTier,
    newTier: nextTier,
    previousStatus: oldStatus,
    newStatus: nextStatus,
    reason: input.reason?.trim(),
    changedBy: actor.email ?? actor.userId,
    source: 'admin',
  });

  await logAuditEvent({
    actorUserId: actor.userId,
    actorRole: 'admin',
    actionType: 'membership_status_change',
    targetId: memberId,
    targetType: 'user',
    before: { membershipTier: oldTier, membershipStatus: oldStatus },
    after: { membershipTier: nextTier, membershipStatus: nextStatus, membershipExpiresAt: nextExpiresAt },
    metadata: { reason: input.reason?.trim() ?? null },
  });

  await safeLogAnalyticsEvent({
    eventType: oldTier !== nextTier ? 'membership_tier_changed' : 'membership_status_changed',
    userId: actor.userId,
    userRole: 'admin',
    targetId: memberId,
    targetType: 'user',
    metadata: { oldTier, nextTier, oldStatus, nextStatus },
  });

  return getMemberDetailForAdmin(memberId);
}

export async function listMembershipHistory(memberId: string): Promise<MembershipHistoryItem[]> {
  const snapshot = await firestore.collection('membership_history').where('userId', '==', memberId).orderBy('changedAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      memberId,
      oldTier: data.previousTier ?? null,
      newTier: data.newTier ?? null,
      oldStatus: data.previousStatus ?? null,
      newStatus: data.newStatus ?? null,
      reason: data.reason ?? null,
      changedBy: String(data.changedBy ?? 'unknown'),
      changedAt: toIso(data.changedAt) ?? new Date(0).toISOString(),
      source: data.source ?? 'admin',
    };
  });
}

export async function addMemberNote(memberId: string, note: string, actor: AdminActor): Promise<MemberNote> {
  const exists = await assertMemberExists(memberId);
  if (!exists) throw new Error('Member not found');

  const now = new Date();
  const ref = await firestore.collection('member_notes').add({
    memberId,
    authorUserId: actor.userId,
    authorName: actor.name ?? actor.email ?? actor.userId,
    note: note.trim(),
    createdAt: now,
    updatedAt: now,
  });

  await logAuditEvent({
    actorUserId: actor.userId,
    actorRole: 'admin',
    actionType: 'user_profile_admin_edit',
    targetId: memberId,
    targetType: 'member_note',
    metadata: { notePreview: note.trim().slice(0, 80) },
  });

  await safeLogAnalyticsEvent({
    eventType: 'member_note_created',
    userId: actor.userId,
    userRole: 'admin',
    targetId: memberId,
    targetType: 'member_note',
  });

  return {
    id: ref.id,
    memberId,
    authorUserId: actor.userId,
    authorName: actor.name ?? actor.email ?? actor.userId,
    note: note.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function listMemberNotes(memberId: string): Promise<MemberNote[]> {
  const snapshot = await firestore.collection('member_notes').where('memberId', '==', memberId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      memberId,
      authorUserId: String(data.authorUserId ?? 'unknown'),
      authorName: data.authorName ?? null,
      note: String(data.note ?? ''),
      createdAt: toIso(data.createdAt) ?? new Date(0).toISOString(),
      updatedAt: toIso(data.updatedAt) ?? new Date(0).toISOString(),
    };
  });
}

export async function applyMemberOverride(memberId: string, reason: string, endDate: string | null, actor: AdminActor): Promise<MemberOverride> {
  const exists = await assertMemberExists(memberId);
  if (!exists) throw new Error('Member not found');

  const snapshot = await firestore.collection('member_overrides').where('memberId', '==', memberId).limit(1).get();
  const now = new Date();
  const payload = {
    memberId,
    enabled: true,
    reason: reason.trim(),
    startDate: now,
    endDate: endDate ? new Date(endDate) : null,
    changedBy: actor.email ?? actor.userId,
    changedAt: now,
  };

  let id: string;
  if (snapshot.empty) {
    const ref = await firestore.collection('member_overrides').add(payload);
    id = ref.id;
  } else {
    id = snapshot.docs[0].id;
    await firestore.collection('member_overrides').doc(id).set(payload, { merge: true });
  }

  await logMembershipHistory({
    userId: memberId,
    previousTier: undefined,
    newTier: undefined,
    previousStatus: undefined,
    newStatus: undefined,
    reason: `Override applied: ${reason.trim()}`,
    changedBy: actor.email ?? actor.userId,
    source: 'manual',
  });

  await logAuditEvent({
    actorUserId: actor.userId,
    actorRole: 'admin',
    actionType: 'manual_access_override',
    targetId: memberId,
    targetType: 'user',
    metadata: { enabled: true, reason: reason.trim(), endDate },
  });

  await safeLogAnalyticsEvent({ eventType: 'manual_override_applied', userId: actor.userId, userRole: 'admin', targetId: memberId, targetType: 'user' });

  return {
    id,
    memberId,
    enabled: true,
    reason: reason.trim(),
    startDate: now.toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : null,
    changedBy: actor.email ?? actor.userId,
    changedAt: now.toISOString(),
  };
}

export async function removeMemberOverride(memberId: string, actor: AdminActor): Promise<void> {
  const snapshot = await firestore.collection('member_overrides').where('memberId', '==', memberId).limit(1).get();
  if (snapshot.empty) return;
  await firestore.collection('member_overrides').doc(snapshot.docs[0].id).set({
    enabled: false,
    changedBy: actor.email ?? actor.userId,
    changedAt: new Date(),
  }, { merge: true });

  await logMembershipHistory({
    userId: memberId,
    previousTier: undefined,
    newTier: undefined,
    previousStatus: undefined,
    newStatus: undefined,
    reason: 'Override removed',
    changedBy: actor.email ?? actor.userId,
    source: 'manual',
  });

  await logAuditEvent({
    actorUserId: actor.userId,
    actorRole: 'admin',
    actionType: 'manual_access_override',
    targetId: memberId,
    targetType: 'user',
    metadata: { enabled: false },
  });
  await safeLogAnalyticsEvent({ eventType: 'manual_override_removed', userId: actor.userId, userRole: 'admin', targetId: memberId, targetType: 'user' });
}
