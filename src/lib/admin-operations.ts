import { firestore } from '@/firebase/server';
import { logAuditEvent } from '@/lib/audit';
import { requireAdminServerContext } from '@/lib/server-auth';

type RequestStatus = 'submitted' | 'in_review' | 'scheduled' | 'in_progress' | 'resolved' | 'completed' | 'cancelled';

export type AdminServiceRequestRow = {
  id: string;
  memberId: string;
  status: RequestStatus | string;
  assignedAdmin?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  requestType?: string | null;
  callType?: 'discovery_call' | 'strategic_checkup' | string | null;
  notes?: string | null;
  description?: string | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | string | null;
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

const mapRequestDoc = (id: string, data: FirebaseFirestore.DocumentData): AdminServiceRequestRow => ({
  id,
  memberId: String(data.memberId ?? ''),
  status: String(data.status ?? 'submitted'),
  assignedAdmin: data.assignedAdmin ? String(data.assignedAdmin) : null,
  createdAt: toIso(data.createdAt) ?? String(data.createdAt ?? ''),
  updatedAt: toIso(data.updatedAt) ?? String(data.updatedAt ?? ''),
  requestType: data.requestType ? String(data.requestType) : null,
  callType: data.callType ? String(data.callType) : null,
  notes: data.notes ? String(data.notes) : null,
  description: data.description ? String(data.description) : null,
  priority: data.priority ? String(data.priority) : null,
});

export async function getServiceRequests(collectionName: 'discovery_calls' | 'support_requests' | 'customisation_requests', opts?: { callType?: 'discovery_call' | 'strategic_checkup' }) {
  await requireAdminServerContext();
  let query: FirebaseFirestore.Query = firestore.collection(collectionName);
  if (opts?.callType) query = query.where('callType', '==', opts.callType);
  const snap = await query.orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => mapRequestDoc(doc.id, doc.data()));
}

export async function updateServiceRequestStatus(collectionName: 'discovery_calls' | 'support_requests' | 'customisation_requests', id: string, status: RequestStatus, note?: string) {
  const auth = await requireAdminServerContext();
  const ref = firestore.collection(collectionName).doc(id);
  await ref.update({ status, notes: note ?? null, assignedAdmin: auth.userId, updatedAt: new Date().toISOString() });
  await logAuditEvent({ actorUserId: auth.userId, actorRole: 'admin', actionType: 'settings_change', targetType: collectionName, targetId: id, metadata: { status, note: note ?? null } });
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
