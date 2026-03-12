import { firestore } from '@/firebase/server';
import type { BillingCycle, MembershipPlanCode, MembershipStatus, MembershipTier } from './definitions';
import { getCustomisationRequestAllowance, getEffectiveMembershipTier, getServiceDiscountPercent } from './entitlements';
import { safeLogAnalyticsEvent } from './analytics-server';
import { expirePromotionalGrants } from './promotions';
import { getUserById, getMembershipAccessGrantsForUser } from './data';
import {
  countStandardCustomisationsThisMonth,
  createCallWorkflow,
  createCustomisationWorkflow,
  createImplementationSupportWorkflow,
  listMemberWorkflows,
  type ServiceWorkflowRecord,
  type WorkflowPriority,
  type WorkflowStatus,
} from './service-workflows';

export type RequestStatus = WorkflowStatus;
export type SupportRequestType = 'implementation_support';
export type DiscoveryCallType = 'discovery_call' | 'strategic_checkup';

export type CustomisationRequestRecord = ServiceWorkflowRecord;
export type SupportRequestRecord = ServiceWorkflowRecord;
export type DiscoveryCallRecord = ServiceWorkflowRecord;

export type SavedItemRecord = {
  id: string;
  memberId: string;
  title: string;
  itemType: 'docushare' | 'knowledge' | 'partner_offer' | 'service' | 'other';
  itemPath: string;
  itemId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecentActivityRecord = {
  id: string;
  memberId: string;
  activityType: 'viewed_resource' | 'accessed_resource' | 'claimed_offer' | 'read_article' | 'request_update' | 'saved_item' | 'clicked_recent';
  title: string;
  itemPath?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const toIsoString = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

export async function getMemberOverview(memberId: string) {
  await expirePromotionalGrants();
  const [user, grants, subscriptionSnap, billingSnap, promoSnap] = await Promise.all([
    getUserById(memberId),
    getMembershipAccessGrantsForUser(memberId),
    firestore.collection('subscriptions').where('userId', '==', memberId).orderBy('updatedAt', 'desc').limit(1).get(),
    firestore.collection('billing_history').where('userId', '==', memberId).orderBy('createdAt', 'desc').limit(5).get(),
    firestore.collection('membership_access_grants').where('userId', '==', memberId).where('status', '==', 'active').orderBy('grantEndAt', 'asc').limit(1).get(),
  ]);

  const subscription = subscriptionSnap.docs[0]?.data();
  const activeGrant = promoSnap.docs[0]?.data();
  const tier = getEffectiveMembershipTier({
    membershipTier: user?.membershipTier,
    membershipStatus: user?.membershipStatus,
    planCode: user?.membershipPlanCode ?? null,
    subscription: subscription ? { membershipTier: subscription.membershipTier, status: subscription.status } : null,
    grants,
  });

  return {
    user,
    tier,
    membershipStatus: (subscription?.status ?? user?.membershipStatus ?? 'pending') as MembershipStatus,
    planCode: (subscription?.membershipPlanCode ?? user?.membershipPlanCode ?? 'basic_free') as MembershipPlanCode,
    billingCycle: (subscription?.billingCycle ?? user?.billingCycle ?? 'free') as BillingCycle,
    renewalDate: subscription?.renewalDate ? toIsoString(subscription.renewalDate) : null,
    endDate: subscription?.endDate ? toIsoString(subscription.endDate) : null,
    lastPaymentStatus: subscription?.lastPaymentStatus ?? user?.lastPaymentStatus ?? null,
    activeGrant: activeGrant
      ? {
          sourceType: String(activeGrant.sourceType ?? 'system'),
          grantTier: String(activeGrant.grantTier ?? ''),
          grantEndAt: toIsoString(activeGrant.grantEndAt),
        }
      : null,
    activePromotionGrantEndAt: user?.activePromotionGrantEndAt ? toIsoString(user.activePromotionGrantEndAt) : null,
    billingHistory: billingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt) })),
    customisationAllowance: getCustomisationRequestAllowance(tier),
    serviceDiscountPercent: getServiceDiscountPercent(tier),
  };
}

export async function countMemberRequestsThisMonth(memberId: string) {
  return countStandardCustomisationsThisMonth(memberId);
}

export async function listCustomisationRequests(memberId: string): Promise<CustomisationRequestRecord[]> {
  return listMemberWorkflows(memberId, 'customisation');
}

export async function createCustomisationRequest(
  memberId: string,
  input: { requestDescription: string; relatedResourceId?: string | null; relatedResourceType?: string | null; relatedResourceTitle?: string | null; requestedOutcome?: string | null; priority?: WorkflowPriority },
  tier: MembershipTier,
  memberName?: string | null,
) {
  const result = await createCustomisationWorkflow({ memberId, memberName, tier, ...input });
  if (!result.ok) throw new Error(result.message);
  return result.id;
}

export async function listSupportRequests(memberId: string): Promise<SupportRequestRecord[]> {
  return listMemberWorkflows(memberId, 'implementation_support');
}

export async function createSupportRequest(memberId: string, input: { description: string; category?: string | null; priority?: WorkflowPriority }, tier: MembershipTier, memberName?: string | null) {
  const result = await createImplementationSupportWorkflow({ memberId, memberName, tier, ...input });
  if (!result.ok) throw new Error(result.message);
  return result.id;
}

export async function listDiscoveryCalls(memberId: string): Promise<DiscoveryCallRecord[]> {
  const [discoveryCalls, strategicCheckups] = await Promise.all([
    listMemberWorkflows(memberId, 'discovery_call'),
    listMemberWorkflows(memberId, 'strategic_checkup'),
  ]);
  return [...discoveryCalls, ...strategicCheckups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createDiscoveryCall(memberId: string, input: { callType: DiscoveryCallType; preferredDateTime?: string | null; requestedWindow?: string | null; notes?: string | null }, tier: MembershipTier, memberName?: string | null) {
  const result = await createCallWorkflow({ memberId, memberName, tier, workflowType: input.callType, preferredDateTime: input.preferredDateTime, requestedWindow: input.requestedWindow, notes: input.notes });
  if (!result.ok) throw new Error(result.message);
  return result.id;
}

export async function listSavedItems(memberId: string): Promise<SavedItemRecord[]> {
  const snapshot = await firestore.collection('user_saved_items').where('memberId', '==', memberId).orderBy('createdAt', 'desc').limit(50).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt), updatedAt: toIsoString(doc.data().updatedAt) })) as SavedItemRecord[];
}

export async function saveItem(memberId: string, input: Omit<SavedItemRecord, 'id' | 'memberId' | 'createdAt' | 'updatedAt'>) {
  const existing = await firestore.collection('user_saved_items').where('memberId', '==', memberId).where('itemPath', '==', input.itemPath).limit(1).get();
  if (!existing.empty) return existing.docs[0].id;
  const now = new Date();
  const ref = await firestore.collection('user_saved_items').add({ ...input, memberId, createdAt: now, updatedAt: now });
  await addRecentActivity(memberId, { activityType: 'saved_item', title: input.title, itemPath: input.itemPath, metadata: { itemType: input.itemType } });
  await safeLogAnalyticsEvent({ eventType: 'resource_saved', userId: memberId, userRole: 'member', targetId: ref.id, targetType: input.itemType });
  return ref.id;
}

export async function listRecentActivity(memberId: string): Promise<RecentActivityRecord[]> {
  const snapshot = await firestore.collection('user_recent_activity').where('memberId', '==', memberId).orderBy('createdAt', 'desc').limit(30).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt) })) as RecentActivityRecord[];
}

export async function addRecentActivity(memberId: string, input: Omit<RecentActivityRecord, 'id' | 'memberId' | 'createdAt'>) {
  await firestore.collection('user_recent_activity').add({ ...input, memberId, createdAt: new Date() });
}
