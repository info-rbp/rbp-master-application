/**
 * Seeds Firestore platform collections from bootstrap data.
 * Idempotent – uses set-with-merge so re-running is safe.
 */
import { PLATFORM_TENANTS, PLATFORM_WORKSPACES, PLATFORM_ROLES, listBootstrapUsers } from '../bootstrap';
import { upsertPrincipal } from './principal-repository';
import { upsertTenant } from './tenant-repository';
import { upsertWorkspace } from './workspace-repository';
import { upsertRoleAssignment } from './role-assignment-repository';
import { upsertTenantMembership } from './tenant-membership-repository';
import { getPlatformDb } from './firestore-client';

const ROLES_COLLECTION = 'platform_roles';

export async function seedPlatformData(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const counts = { tenants: 0, workspaces: 0, roles: 0, principals: 0, roleAssignments: 0, tenantMemberships: 0 };

  for (const tenant of PLATFORM_TENANTS) {
    await upsertTenant(tenant);
    counts.tenants++;
  }

  for (const workspace of PLATFORM_WORKSPACES) {
    await upsertWorkspace(workspace);
    counts.workspaces++;
  }

  const db = getPlatformDb();
  for (const role of PLATFORM_ROLES) {
    await db.collection(ROLES_COLLECTION).doc(role.id).set({ ...role, updatedAt: new Date().toISOString() }, { merge: true });
    counts.roles++;
  }

  for (const entry of listBootstrapUsers()) {
    await upsertPrincipal(entry.user);
    counts.principals++;

    for (const assignment of entry.roleAssignments) {
      await upsertRoleAssignment(entry.user.id, assignment);
      counts.roleAssignments++;
    }

    for (const tenantId of entry.tenantIds ?? []) {
      await upsertTenantMembership(entry.user.id, tenantId, 'active');
      counts.tenantMemberships++;
    }
  }

  return { seeded: true, counts };
}
