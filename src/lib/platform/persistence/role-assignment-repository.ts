import type { RoleAssignment } from '../types';
import { getPlatformDb } from './firestore-client';

const COLLECTION = 'platform_role_assignments';

export type RoleAssignmentRecord = RoleAssignment & {
  id: string;
  principalId: string;
  createdAt: string;
};

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

function assignmentId(principalId: string, assignment: RoleAssignment): string {
  return `${principalId}__${assignment.roleId}__${assignment.tenantId ?? 'global'}__${assignment.workspaceId ?? 'any'}`;
}

export async function upsertRoleAssignment(principalId: string, assignment: RoleAssignment): Promise<RoleAssignmentRecord> {
  const id = assignmentId(principalId, assignment);
  const now = new Date().toISOString();
  const record: RoleAssignmentRecord = {
    id,
    principalId,
    ...assignment,
    createdAt: now,
  };
  await collection().doc(id).set(record, { merge: true });
  return record;
}

export async function listRoleAssignmentsForPrincipal(principalId: string): Promise<RoleAssignmentRecord[]> {
  const snap = await collection().where('principalId', '==', principalId).limit(200).get();
  return snap.docs.map((doc) => doc.data() as RoleAssignmentRecord);
}

export async function listRoleAssignmentsForTenant(tenantId: string): Promise<RoleAssignmentRecord[]> {
  const snap = await collection().where('tenantId', '==', tenantId).limit(500).get();
  return snap.docs.map((doc) => doc.data() as RoleAssignmentRecord);
}

export async function removeRoleAssignment(principalId: string, assignment: RoleAssignment): Promise<void> {
  const id = assignmentId(principalId, assignment);
  await collection().doc(id).delete();
}
