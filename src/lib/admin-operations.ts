import { firestore } from '@/firebase/server';
import { logAuditEvent } from '@/lib/audit';
import { requireAdminServerContext } from '@/lib/server-auth';
import { listServiceQueue, updateWorkflowByAdmin, type ServiceWorkflowType, type WorkflowPriority, type WorkflowStatus } from './service-workflows';

export type AdminServiceRequestRow = {
  id: string;
  memberId: string;
  memberName?: string | null;
  workflowType: ServiceWorkflowType;
  status: WorkflowStatus;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  description?: string | null;
  memberVisibleUpdate?: string | null;
  internalNotes?: string | null;
  priority?: WorkflowPriority;
  preferredDateTime?: string | null;
};

export type PromotionType = 'free_membership' | 'discount_code' | 'service_purchase' | 'annual_plan';
export type AdminPromotion = {
  id: string;
  title: string;
  type: PromotionType;
  description?: string;
  active: boolean;
  targetTier?: 'basic' | 'standard' | 'premium';
  metadata?: Record<string, unknown>;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const toIso = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
};

export async function getServiceRequests(workflowType: ServiceWorkflowType, filters?: { status?: WorkflowStatus; priority?: WorkflowPriority; memberId?: string; assignedAdminId?: string }) {
  await requireAdminServerContext();
  const rows = await listServiceQueue({ workflowType, ...filters });
  return rows.map((row) => ({
    id: row.id,
    memberId: row.memberId,
    memberName: row.memberName,
    workflowType: row.workflowType,
    status: row.status,
    assignedAdminId: row.assignedAdminId,
    assignedAdminName: row.assignedAdminName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    description: row.requestDescription,
    memberVisibleUpdate: row.memberVisibleUpdate,
    internalNotes: row.internalNotes,
    priority: row.priority,
    preferredDateTime: row.preferredDateTime,
  }));
}

export async function updateServiceRequestStatus(input: {
  workflowType: ServiceWorkflowType;
  id: string;
  status: WorkflowStatus;
  priority?: WorkflowPriority;
  memberVisibleUpdate?: string;
  internalNotes?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
}) {
  const auth = await requireAdminServerContext();
  await updateWorkflowByAdmin({
    actorUserId: auth.userId,
    workflowType: input.workflowType,
    id: input.id,
    status: input.status,
    priority: input.priority,
    internalNotes: input.internalNotes,
    memberVisibleUpdate: input.memberVisibleUpdate,
    assignedAdminId: input.assignedAdminId ?? auth.userId,
    assignedAdminName: input.assignedAdminName ?? auth.email ?? auth.userId,
  });
}

export async function getPromotions(type?: PromotionType) {
  await requireAdminServerContext();
  let query: FirebaseFirestore.Query = firestore.collection('admin_promotions');
  if (type) query = query.where('type', '==', type);
  const snap = await query.orderBy('updatedAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: String(data.title ?? ''),
      type: (data.type ?? 'discount_code') as PromotionType,
      description: data.description ? String(data.description) : undefined,
      active: Boolean(data.active),
      targetTier: data.targetTier,
      metadata: (data.metadata as Record<string, unknown> | undefined) ?? {},
      startsAt: toIso(data.startsAt),
      endsAt: toIso(data.endsAt),
      createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
      updatedAt: toIso(data.updatedAt) ?? new Date().toISOString(),
    } satisfies AdminPromotion;
  });
}

export async function upsertPromotion(input: Omit<AdminPromotion, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const auth = await requireAdminServerContext();
  const now = new Date().toISOString();
  const payload = {
    title: input.title,
    type: input.type,
    description: input.description ?? null,
    active: input.active,
    targetTier: input.targetTier ?? null,
    metadata: input.metadata ?? {},
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    updatedAt: now,
  };

  if (input.id) {
    await firestore.collection('admin_promotions').doc(input.id).set(payload, { merge: true });
    await logAuditEvent({ actorUserId: auth.userId, actorRole: 'admin', actionType: 'settings_change', targetType: 'admin_promotion', targetId: input.id, metadata: payload });
    return input.id;
  }

  const ref = await firestore.collection('admin_promotions').add({ ...payload, createdAt: now });
  await logAuditEvent({ actorUserId: auth.userId, actorRole: 'admin', actionType: 'settings_change', targetType: 'admin_promotion', targetId: ref.id, metadata: payload });
  return ref.id;
}
