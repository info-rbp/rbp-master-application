import type { Workspace, RecordStatus } from '../types';
import { getPlatformDb } from './firestore-client';

const COLLECTION = 'platform_workspaces';

export type WorkspaceRecord = Workspace & {
  createdAt: string;
  updatedAt: string;
};

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

export async function upsertWorkspace(workspace: Workspace): Promise<WorkspaceRecord> {
  const now = new Date().toISOString();
  const ref = collection().doc(workspace.id);
  const existing = await ref.get();
  const record: WorkspaceRecord = {
    ...workspace,
    createdAt: existing.exists ? (existing.data() as WorkspaceRecord).createdAt : now,
    updatedAt: now,
  };
  await ref.set(record, { merge: true });
  return record;
}

export async function getWorkspaceById(id: string): Promise<WorkspaceRecord | null> {
  const snap = await collection().doc(id).get();
  return snap.exists ? (snap.data() as WorkspaceRecord) : null;
}

export async function listWorkspacesForTenant(tenantId: string, filters?: { status?: RecordStatus }): Promise<WorkspaceRecord[]> {
  let query: FirebaseFirestore.Query = collection().where('tenantId', '==', tenantId);
  if (filters?.status) query = query.where('status', '==', filters.status);
  const snap = await query.limit(100).get();
  return snap.docs.map((doc) => doc.data() as WorkspaceRecord);
}
