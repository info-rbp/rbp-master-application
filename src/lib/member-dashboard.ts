import { firestore } from '@/firebase/server';
import type { BillingCycle, MembershipPlanCode, MembershipStatus, MembershipTier } from './definitions';
import { getCustomisationRequestAllowance, getEffectiveMembershipTier, getServiceDiscountPercent } from './entitlements';
import { safeLogAnalyticsEvent } from './analytics';
import { getUserById, getMembershipAccessGrantsForUser } from './data';

export type RequestStatus = 'submitted' | 'in_progress' | 'waiting_on_member' | 'completed' | 'canceled';
export type SupportRequestType = 'implementation_support' | 'general_support';
export type DiscoveryCallType = 'discovery_call' | 'strategic_checkup';

export type CustomisationRequestRecord = {
  id: string;
  memberId: string;
  relatedResourceId?: string | null;
  requestDescription: string;
  status: RequestStatus;
  priority?: 'low' | 'normal' | 'high';
  assignedAdmin?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type SupportRequestRecord = {
  id: string;
  memberId: string;
  requestType: SupportRequestType;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: RequestStatus;
  assignedAdmin?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type DiscoveryCallRecord = {
  id: string;
  memberId: string;
  callType: DiscoveryCallType;
  preferredDateTime?: string | null;
  requestedWindow?: string | null;
  notes?: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

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
    billingHistory: billingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt) })),
    customisationAllowance: getCustomisationRequestAllowance(tier),
    serviceDiscountPercent: getServiceDiscountPercent(tier),
  };
}

export async function countMemberRequestsThisMonth(memberId: string) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const snapshot = await firestore
    .collection('customisation_requests')
    .where('memberId', '==', memberId)
    .where('createdAt', '>=', monthStart)
    .get();
  return snapshot.size;
}

export async function listCustomisationRequests(memberId: string): Promise<CustomisationRequestRecord[]> {
  const snapshot = await firestore.collection('customisation_requests').where('memberId', '==', memberId).orderBy('createdAt', 'desc').limit(50).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    memberId,
    relatedResourceId: doc.data().relatedResourceId ? String(doc.data().relatedResourceId) : null,
    requestDescription: String(doc.data().requestDescription ?? ''),
    status: (doc.data().status ?? 'submitted') as RequestStatus,
    priority: doc.data().priority as CustomisationRequestRecord['priority'],
    assignedAdmin: doc.data().assignedAdmin ? String(doc.data().assignedAdmin) : null,
    createdAt: toIsoString(doc.data().createdAt),
    updatedAt: toIsoString(doc.data().updatedAt),
    completedAt: doc.data().completedAt ? toIsoString(doc.data().completedAt) : null,
  }));
}

export async function createCustomisationRequest(memberId: string, input: { requestDescription: string; relatedResourceId?: string | null; priority?: 'low' | 'normal' | 'high' }, tier: MembershipTier) {
  const used = await countMemberRequestsThisMonth(memberId);
  const allowance = getCustomisationRequestAllowance(tier);
  if (allowance !== 'unlimited' && used >= allowance) {
    throw new Error('Customisation request allowance reached for this month.');
  }
  const now = new Date();
  const ref = await firestore.collection('customisation_requests').add({
    memberId,
    relatedResourceId: input.relatedResourceId ?? null,
    requestDescription: input.requestDescription,
    status: 'submitted',
    priority: input.priority ?? 'normal',
    assignedAdmin: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });
  await safeLogAnalyticsEvent({ eventType: 'customisation_request_submitted', userId: memberId, userRole: 'member', targetId: ref.id, targetType: 'customisation_request' });
  return ref.id;
}

export async function listSupportRequests(memberId: string): Promise<SupportRequestRecord[]> {
  const snapshot = await firestore.collection('support_requests').where('memberId', '==', memberId).orderBy('createdAt', 'desc').limit(50).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt), updatedAt: toIsoString(doc.data().updatedAt), completedAt: doc.data().completedAt ? toIsoString(doc.data().completedAt) : null })) as SupportRequestRecord[];
}

export async function createSupportRequest(memberId: string, input: { requestType: SupportRequestType; description: string; priority?: SupportRequestRecord['priority'] }) {
  const now = new Date();
  const ref = await firestore.collection('support_requests').add({ memberId, requestType: input.requestType, description: input.description, priority: input.priority ?? 'normal', status: 'submitted', assignedAdmin: null, createdAt: now, updatedAt: now, completedAt: null });
  await safeLogAnalyticsEvent({ eventType: 'support_request_submitted', userId: memberId, userRole: 'member', targetId: ref.id, targetType: input.requestType });
  return ref.id;
}

export async function listDiscoveryCalls(memberId: string): Promise<DiscoveryCallRecord[]> {
  const snapshot = await firestore.collection('discovery_calls').where('memberId', '==', memberId).orderBy('createdAt', 'desc').limit(50).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt), updatedAt: toIsoString(doc.data().updatedAt), completedAt: doc.data().completedAt ? toIsoString(doc.data().completedAt) : null })) as DiscoveryCallRecord[];
}

export async function createDiscoveryCall(memberId: string, input: { callType: DiscoveryCallType; preferredDateTime?: string | null; requestedWindow?: string | null; notes?: string | null }) {
  const now = new Date();
  const ref = await firestore.collection('discovery_calls').add({ memberId, callType: input.callType, preferredDateTime: input.preferredDateTime ?? null, requestedWindow: input.requestedWindow ?? null, notes: input.notes ?? null, status: 'submitted', createdAt: now, updatedAt: now, completedAt: null });
  await safeLogAnalyticsEvent({ eventType: 'discovery_call_requested', userId: memberId, userRole: 'member', targetId: ref.id, targetType: input.callType });
  return ref.id;
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
