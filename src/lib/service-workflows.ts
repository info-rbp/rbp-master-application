import { firestore } from '@/firebase/server';
import type { MembershipTier } from './definitions';
import {
  canAccessImplementationSupport,
  canBookDiscoveryCall,
  canBookStrategicCheckup,
  getCustomisationRequestAllowance,
} from './entitlements';
import { safeLogAnalyticsEvent } from './analytics';
import { logAuditEvent } from './audit';

export const WORKFLOW_STATUS = ['submitted', 'under_review', 'assigned', 'in_progress', 'awaiting_member', 'completed', 'cancelled'] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUS)[number];

export const WORKFLOW_PRIORITY = ['low', 'normal', 'high', 'urgent'] as const;
export type WorkflowPriority = (typeof WORKFLOW_PRIORITY)[number];

export type ServiceWorkflowType = 'customisation' | 'implementation_support' | 'discovery_call' | 'strategic_checkup';

export type ServiceWorkflowRecord = {
  id: string;
  memberId: string;
  memberName?: string | null;
  workflowType: ServiceWorkflowType;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  requestDescription?: string | null;
  requestedOutcome?: string | null;
  category?: string | null;
  relatedResourceId?: string | null;
  relatedResourceType?: string | null;
  relatedResourceTitle?: string | null;
  preferredDateTime?: string | null;
  requestedWindow?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  resolutionSummary?: string | null;
  memberVisibleUpdate?: string | null;
  internalNotes?: string | null;
  periodKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CollectionName = 'customisation_requests' | 'support_requests' | 'discovery_calls';

const toIso = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

const startOfMonthUtc = (value = new Date()) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));
const getPeriodKey = (value = new Date()) => `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;

const workflowCollection = (workflowType: ServiceWorkflowType): CollectionName => {
  if (workflowType === 'customisation') return 'customisation_requests';
  if (workflowType === 'implementation_support') return 'support_requests';
  return 'discovery_calls';
};

const mapDoc = (id: string, data: FirebaseFirestore.DocumentData): ServiceWorkflowRecord => ({
  id,
  memberId: String(data.memberId ?? ''),
  memberName: data.memberName ? String(data.memberName) : null,
  workflowType: (data.workflowType ?? 'customisation') as ServiceWorkflowType,
  status: (data.status ?? 'submitted') as WorkflowStatus,
  priority: (data.priority ?? 'normal') as WorkflowPriority,
  assignedAdminId: data.assignedAdminId ? String(data.assignedAdminId) : null,
  assignedAdminName: data.assignedAdminName ? String(data.assignedAdminName) : null,
  requestDescription: data.requestDescription ? String(data.requestDescription) : null,
  requestedOutcome: data.requestedOutcome ? String(data.requestedOutcome) : null,
  category: data.category ? String(data.category) : null,
  relatedResourceId: data.relatedResourceId ? String(data.relatedResourceId) : null,
  relatedResourceType: data.relatedResourceType ? String(data.relatedResourceType) : null,
  relatedResourceTitle: data.relatedResourceTitle ? String(data.relatedResourceTitle) : null,
  preferredDateTime: data.preferredDateTime ? String(data.preferredDateTime) : null,
  requestedWindow: data.requestedWindow ? String(data.requestedWindow) : null,
  scheduledAt: data.scheduledAt ? toIso(data.scheduledAt) : null,
  completedAt: data.completedAt ? toIso(data.completedAt) : null,
  resolutionSummary: data.resolutionSummary ? String(data.resolutionSummary) : null,
  memberVisibleUpdate: data.memberVisibleUpdate ? String(data.memberVisibleUpdate) : null,
  internalNotes: data.internalNotes ? String(data.internalNotes) : null,
  periodKey: data.periodKey ? String(data.periodKey) : null,
  createdAt: toIso(data.createdAt),
  updatedAt: toIso(data.updatedAt),
});

export async function countStandardCustomisationsThisMonth(memberId: string, now = new Date()) {
  const monthStart = startOfMonthUtc(now);
  const periodKey = getPeriodKey(now);
  const keyed = await firestore.collection('customisation_requests').where('memberId', '==', memberId).where('periodKey', '==', periodKey).get();
  if (!keyed.empty) return keyed.size;
  const legacy = await firestore.collection('customisation_requests').where('memberId', '==', memberId).where('createdAt', '>=', monthStart).get();
  return legacy.size;
}

export async function listMemberWorkflows(memberId: string, workflowType: ServiceWorkflowType): Promise<ServiceWorkflowRecord[]> {
  const collectionName = workflowCollection(workflowType);
  let query: FirebaseFirestore.Query = firestore.collection(collectionName).where('memberId', '==', memberId);
  if (collectionName === 'support_requests') {
    query = query.where('workflowType', '==', 'implementation_support');
  }
  if (collectionName === 'discovery_calls') {
    query = query.where('workflowType', '==', workflowType);
  }
  const snap = await query.orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => mapDoc(doc.id, doc.data()));
}

export async function createCustomisationWorkflow(input: {
  memberId: string;
  memberName?: string | null;
  tier: MembershipTier;
  requestDescription: string;
  requestedOutcome?: string | null;
  relatedResourceId?: string | null;
  relatedResourceType?: string | null;
  relatedResourceTitle?: string | null;
  priority?: WorkflowPriority;
}) {
  const allowance = getCustomisationRequestAllowance(input.tier);
  if (allowance !== 'unlimited' && allowance <= 0) {
    return { ok: false as const, code: 'not_entitled', message: 'Customisation requests are not included in your current membership tier.' };
  }

  const used = await countStandardCustomisationsThisMonth(input.memberId);
  if (allowance !== 'unlimited' && used >= allowance) {
    return { ok: false as const, code: 'monthly_limit_reached', message: 'You have reached your monthly customisation request allowance.' };
  }

  const now = new Date();
  const ref = await firestore.collection('customisation_requests').add({
    memberId: input.memberId,
    memberName: input.memberName ?? null,
    workflowType: 'customisation',
    requestType: 'customisation',
    status: 'submitted',
    priority: input.priority ?? 'normal',
    assignedAdminId: null,
    assignedAdminName: null,
    requestDescription: input.requestDescription,
    requestedOutcome: input.requestedOutcome ?? null,
    relatedResourceId: input.relatedResourceId ?? null,
    relatedResourceType: input.relatedResourceType ?? null,
    relatedResourceTitle: input.relatedResourceTitle ?? null,
    memberVisibleUpdate: 'Submitted for review.',
    internalNotes: null,
    periodKey: getPeriodKey(now),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  await safeLogAnalyticsEvent({ eventType: 'customisation_request_submitted', userId: input.memberId, userRole: 'member', targetType: 'customisation_request', targetId: ref.id });
  return { ok: true as const, id: ref.id };
}

export async function createImplementationSupportWorkflow(input: {
  memberId: string;
  memberName?: string | null;
  tier: MembershipTier;
  description: string;
  category?: string | null;
  priority?: WorkflowPriority;
}) {
  if (!canAccessImplementationSupport(input.tier)) {
    return { ok: false as const, code: 'not_entitled', message: 'Implementation support is available to Premium members.' };
  }

  const now = new Date();
  const ref = await firestore.collection('support_requests').add({
    memberId: input.memberId,
    memberName: input.memberName ?? null,
    workflowType: 'implementation_support',
    requestType: 'implementation_support',
    category: input.category ?? null,
    requestDescription: input.description,
    status: 'submitted',
    priority: input.priority ?? 'normal',
    assignedAdminId: null,
    assignedAdminName: null,
    resolutionSummary: null,
    memberVisibleUpdate: 'Submitted for review.',
    internalNotes: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  await safeLogAnalyticsEvent({ eventType: 'support_request_submitted', userId: input.memberId, userRole: 'member', targetType: 'implementation_support', targetId: ref.id });
  return { ok: true as const, id: ref.id };
}

export async function createCallWorkflow(input: {
  memberId: string;
  memberName?: string | null;
  tier: MembershipTier;
  workflowType: 'discovery_call' | 'strategic_checkup';
  preferredDateTime?: string | null;
  requestedWindow?: string | null;
  notes?: string | null;
}) {
  if (input.workflowType === 'strategic_checkup' && !canBookStrategicCheckup(input.tier)) {
    return { ok: false as const, code: 'not_entitled', message: 'Strategic check-ups are available to Premium members.' };
  }
  if (input.workflowType === 'discovery_call' && !canBookDiscoveryCall(input.tier)) {
    return { ok: false as const, code: 'not_entitled', message: 'Discovery calls are not available for your membership tier.' };
  }

  const now = new Date();
  const ref = await firestore.collection('discovery_calls').add({
    memberId: input.memberId,
    memberName: input.memberName ?? null,
    workflowType: input.workflowType,
    callType: input.workflowType,
    status: 'submitted',
    priority: 'normal',
    preferredDateTime: input.preferredDateTime ?? null,
    requestedWindow: input.requestedWindow ?? null,
    requestDescription: input.notes ?? null,
    memberVisibleUpdate: 'Request received. Scheduling review pending.',
    internalNotes: null,
    assignedAdminId: null,
    assignedAdminName: null,
    scheduledAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await safeLogAnalyticsEvent({
    eventType: 'discovery_call_requested',
    userId: input.memberId,
    userRole: 'member',
    targetType: input.workflowType,
    targetId: ref.id,
  });
  return { ok: true as const, id: ref.id };
}

export type ServiceQueueFilter = {
  workflowType?: ServiceWorkflowType;
  status?: WorkflowStatus;
  priority?: WorkflowPriority;
  memberId?: string;
  assignedAdminId?: string;
};

export async function listServiceQueue(filter: ServiceQueueFilter = {}) {
  const collectionName = filter.workflowType ? workflowCollection(filter.workflowType) : 'customisation_requests';
  let query: FirebaseFirestore.Query = firestore.collection(collectionName);
  if (filter.workflowType) query = query.where('workflowType', '==', filter.workflowType);
  if (filter.status) query = query.where('status', '==', filter.status);
  if (filter.priority) query = query.where('priority', '==', filter.priority);
  if (filter.memberId) query = query.where('memberId', '==', filter.memberId);
  if (filter.assignedAdminId) query = query.where('assignedAdminId', '==', filter.assignedAdminId);
  const snap = await query.orderBy('createdAt', 'desc').limit(200).get();
  return snap.docs.map((doc) => mapDoc(doc.id, doc.data()));
}

export async function updateWorkflowByAdmin(input: {
  actorUserId: string;
  workflowType: ServiceWorkflowType;
  id: string;
  status?: WorkflowStatus;
  priority?: WorkflowPriority;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  internalNotes?: string | null;
  memberVisibleUpdate?: string | null;
  resolutionSummary?: string | null;
  scheduledAt?: string | null;
}) {
  const collectionName = workflowCollection(input.workflowType);
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = { updatedAt: nowIso };
  if (input.status) patch.status = input.status;
  if (input.priority) patch.priority = input.priority;
  if (input.assignedAdminId !== undefined) patch.assignedAdminId = input.assignedAdminId;
  if (input.assignedAdminName !== undefined) patch.assignedAdminName = input.assignedAdminName;
  if (input.internalNotes !== undefined) patch.internalNotes = input.internalNotes;
  if (input.memberVisibleUpdate !== undefined) patch.memberVisibleUpdate = input.memberVisibleUpdate;
  if (input.resolutionSummary !== undefined) patch.resolutionSummary = input.resolutionSummary;
  if (input.scheduledAt !== undefined) patch.scheduledAt = input.scheduledAt;
  if (input.status === 'completed') patch.completedAt = nowIso;

  await firestore.collection(collectionName).doc(input.id).set(patch, { merge: true });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: 'admin',
    actionType: 'settings_change',
    targetType: collectionName,
    targetId: input.id,
    metadata: patch,
  });

  if (input.status) {
    await safeLogAnalyticsEvent({
      eventType: input.status === 'completed' ? 'service_workflow_completed' : 'service_workflow_status_changed',
      userId: input.actorUserId,
      userRole: 'admin',
      targetType: input.workflowType,
      targetId: input.id,
      metadata: { status: input.status, workflowType: input.workflowType },
    });
  }
}
