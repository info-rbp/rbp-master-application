import type { Tenant, RecordStatus } from '../types';
import { getPlatformDb } from './firestore-client';

const COLLECTION = 'platform_tenants';

export type TenantRecord = Tenant & {
  createdAt: string;
  updatedAt: string;
};

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

export async function upsertTenant(tenant: Tenant): Promise<TenantRecord> {
  const now = new Date().toISOString();
  const ref = collection().doc(tenant.id);
  const existing = await ref.get();
  const record: TenantRecord = {
    ...tenant,
    createdAt: existing.exists ? (existing.data() as TenantRecord).createdAt : now,
    updatedAt: now,
  };
  await ref.set(record, { merge: true });
  return record;
}

export async function getTenantById(id: string): Promise<TenantRecord | null> {
  const snap = await collection().doc(id).get();
  return snap.exists ? (snap.data() as TenantRecord) : null;
}

export async function listTenants(filters?: { status?: RecordStatus }): Promise<TenantRecord[]> {
  let query: FirebaseFirestore.Query = collection();
  if (filters?.status) query = query.where('status', '==', filters.status);
  const snap = await query.orderBy('updatedAt', 'desc').limit(200).get();
  return snap.docs.map((doc) => doc.data() as TenantRecord);
}
