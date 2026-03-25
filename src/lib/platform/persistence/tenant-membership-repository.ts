import { getPlatformDb } from './firestore-client';

const COLLECTION = 'platform_tenant_memberships';

export type TenantMembershipRecord = {
  id: string;
  principalId: string;
  tenantId: string;
  status: 'active' | 'inactive' | 'invited';
  joinedAt: string;
  updatedAt: string;
};

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

function membershipId(principalId: string, tenantId: string) {
  return `${principalId}__${tenantId}`;
}

export async function upsertTenantMembership(principalId: string, tenantId: string, status: TenantMembershipRecord['status'] = 'active'): Promise<TenantMembershipRecord> {
  const id = membershipId(principalId, tenantId);
  const now = new Date().toISOString();
  const ref = collection().doc(id);
  const existing = await ref.get();
  const record: TenantMembershipRecord = {
    id,
    principalId,
    tenantId,
    status,
    joinedAt: existing.exists ? (existing.data() as TenantMembershipRecord).joinedAt : now,
    updatedAt: now,
  };
  await ref.set(record, { merge: true });
  return record;
}

export async function listTenantMembershipsForPrincipal(principalId: string): Promise<TenantMembershipRecord[]> {
  const snap = await collection().where('principalId', '==', principalId).where('status', '==', 'active').limit(100).get();
  return snap.docs.map((doc) => doc.data() as TenantMembershipRecord);
}

export async function listTenantMembershipsForTenant(tenantId: string): Promise<TenantMembershipRecord[]> {
  const snap = await collection().where('tenantId', '==', tenantId).limit(500).get();
  return snap.docs.map((doc) => doc.data() as TenantMembershipRecord);
}

export async function removeTenantMembership(principalId: string, tenantId: string): Promise<void> {
  await collection().doc(membershipId(principalId, tenantId)).delete();
}
