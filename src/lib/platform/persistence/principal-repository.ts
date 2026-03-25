import type { UserIdentity, RecordStatus } from '../types';
import { getPlatformDb } from './firestore-client';

const COLLECTION = 'platform_principals';

export type PrincipalRecord = UserIdentity & {
  createdAt: string;
  updatedAt: string;
};

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

export async function upsertPrincipal(user: UserIdentity): Promise<PrincipalRecord> {
  const now = new Date().toISOString();
  const ref = collection().doc(user.id);
  const existing = await ref.get();
  const record: PrincipalRecord = {
    ...user,
    createdAt: existing.exists ? (existing.data() as PrincipalRecord).createdAt : now,
    updatedAt: now,
  };
  await ref.set(record, { merge: true });
  return record;
}

export async function getPrincipalById(id: string): Promise<PrincipalRecord | null> {
  const snap = await collection().doc(id).get();
  return snap.exists ? (snap.data() as PrincipalRecord) : null;
}

export async function getPrincipalByEmail(email: string): Promise<PrincipalRecord | null> {
  const snap = await collection().where('email', '==', email.toLowerCase()).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as PrincipalRecord);
}

export async function getPrincipalByProviderId(providerUserId: string): Promise<PrincipalRecord | null> {
  const snap = await collection().where('authProviderUserId', '==', providerUserId).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as PrincipalRecord);
}

export async function listPrincipals(filters?: { status?: RecordStatus }): Promise<PrincipalRecord[]> {
  let query: FirebaseFirestore.Query = collection();
  if (filters?.status) query = query.where('status', '==', filters.status);
  const snap = await query.orderBy('updatedAt', 'desc').limit(200).get();
  return snap.docs.map((doc) => doc.data() as PrincipalRecord);
}
