import { firestore } from '@/firebase/server';
import type { MembershipPlanCode, MembershipTier } from './definitions';
import { getHigherMembershipTier } from './entitlements';
import { safeLogAnalyticsEvent } from './analytics';
import { logAuditEvent } from './audit';
import { triggerMembershipAlert } from './alerts';

export const PROMOTION_TYPES = ['service_purchase_standard_trial', 'discount_code', 'annual_plan', 'referral', 'seasonal', 'bundle', 'limited_time_unlock'] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];
export type PromotionStatus = 'active' | 'inactive' | 'expired' | 'scheduled';

export type PromotionRecord = {
  id: string;
  type: PromotionType;
  status: PromotionStatus;
  applicableTier?: MembershipTier | null;
  applicablePlanCode?: MembershipPlanCode | null;
  sourceType: string;
  sourceReferenceId: string;
  grantTier?: MembershipTier | null;
  grantStartAt?: string | null;
  grantEndAt?: string | null;
  durationDays?: number | null;
  durationMonths?: number | null;
  notes?: string | null;
  rules?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function calculatePromotionWindow(startAt: Date, durationMonths = 0, durationDays = 0) {
  const end = new Date(startAt);
  if (durationMonths > 0) end.setUTCMonth(end.getUTCMonth() + durationMonths);
  if (durationDays > 0) end.setUTCDate(end.getUTCDate() + durationDays);
  return { grantStartAt: startAt.toISOString(), grantEndAt: end.toISOString() };
}

export function resolvePromotionalEffectiveTier(baseTier: MembershipTier, grantTier: MembershipTier) {
  return getHigherMembershipTier(baseTier, grantTier);
}

export async function grantStandardTrialFromServicePurchase(input: {
  userId: string;
  servicePurchaseId: string;
  actorUserId: string;
  actorRole?: 'admin' | 'system';
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const sourceType = 'service_purchase';
  const sourceReferenceId = input.servicePurchaseId;

  const existing = await firestore.collection('membership_access_grants')
    .where('userId', '==', input.userId)
    .where('sourceType', '==', sourceType)
    .where('sourceReferenceId', '==', sourceReferenceId)
    .where('grantTier', '==', 'standard')
    .limit(1)
    .get();

  if (!existing.empty) return { grantId: existing.docs[0].id, created: false as const };

  const window = calculatePromotionWindow(now, 3, 0);

  const grantRef = await firestore.collection('membership_access_grants').add({
    userId: input.userId,
    sourceType,
    sourceReferenceId,
    grantTier: 'standard',
    grantStartAt: window.grantStartAt,
    grantEndAt: window.grantEndAt,
    status: 'active',
    notes: 'Three month standard promotional grant after qualifying service purchase.',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  await firestore.collection('promotions').add({
    type: 'service_purchase_standard_trial',
    status: 'active',
    applicableTier: 'basic',
    applicablePlanCode: null,
    sourceType,
    sourceReferenceId,
    grantTier: 'standard',
    grantStartAt: window.grantStartAt,
    grantEndAt: window.grantEndAt,
    durationMonths: 3,
    durationDays: null,
    notes: 'Auto-issued for completed qualifying service purchase workflow.',
    rules: { stackMode: 'highest_tier_wins', allowFutureExtensions: true },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  await firestore.collection('users').doc(input.userId).set({
    activePromotionGrantEndAt: window.grantEndAt,
    activePromotionGrantTier: 'standard',
    updatedAt: now.toISOString(),
  }, { merge: true });

  await safeLogAnalyticsEvent({ eventType: 'promotion_granted', userId: input.userId, userRole: 'member', targetId: grantRef.id, targetType: 'membership_access_grant' });
  await logAuditEvent({ actorUserId: input.actorUserId, actorRole: input.actorRole ?? 'system', actionType: 'membership_status_change', targetType: 'membership_access_grant', targetId: grantRef.id, metadata: { sourceType, sourceReferenceId, grantTier: 'standard', grantEndAt: window.grantEndAt } });

  const user = await firestore.collection('users').doc(input.userId).get();
  const email = String(user.data()?.email ?? '').trim();
  if (email) {
    await triggerMembershipAlert({
      type: 'membership_expiring',
      userId: input.userId,
      email,
      title: 'Standard promotion activated',
      message: 'Your 3-month Standard membership promotion is now active.',
      actionUrl: '/portal/subscription',
      membershipEndDate: window.grantEndAt,
      reason: 'qualifying_service_purchase',
    });
  }

  return { grantId: grantRef.id, created: true as const, ...window };
}

export async function expirePromotionalGrants(now = new Date()) {
  const nowIso = now.toISOString();
  const snapshot = await firestore.collection('membership_access_grants')
    .where('status', '==', 'active')
    .where('grantEndAt', '<=', nowIso)
    .limit(200)
    .get();

  if (snapshot.empty) return { expiredCount: 0 };

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.set(doc.ref, { status: 'expired', updatedAt: nowIso }, { merge: true }));
  await batch.commit();

  await Promise.all(snapshot.docs.map(async (doc) => {
    const userId = String(doc.data().userId ?? '');
    if (userId) {
      await firestore.collection('users').doc(userId).set({ activePromotionGrantEndAt: null, activePromotionGrantTier: null, updatedAt: nowIso }, { merge: true });
    }
    await safeLogAnalyticsEvent({ eventType: 'promotion_expired', userId, userRole: 'member', targetId: doc.id, targetType: 'membership_access_grant' });
  }));

  return { expiredCount: snapshot.size };
}
