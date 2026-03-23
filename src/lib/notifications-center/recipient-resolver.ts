import { listBootstrapUsers } from '@/lib/platform/bootstrap';
import type { NotificationRecipientType } from '@/lib/notifications-center/types';

export class RecipientResolver {
  async resolve(input: { tenantId: string; workspaceId?: string; recipientType: NotificationRecipientType; recipientId: string; recipientScope?: string }) {
    const users = listBootstrapUsers().filter((entry) => entry.tenantIds.includes(input.tenantId));
    if (input.recipientType === 'user') return users.filter((entry) => entry.user.id === input.recipientId).map((entry) => ({ userId: entry.user.id, displayName: entry.user.displayName }));
    if (input.recipientType === 'tenant_admins') return users.filter((entry) => entry.roleAssignments.some((role) => role.roleId === 'role_tenant_admin' || !role.tenantId)).map((entry) => ({ userId: entry.user.id, displayName: entry.user.displayName }));
    if (input.recipientType === 'role') return users.filter((entry) => entry.roleAssignments.some((role) => role.roleId === input.recipientId)).map((entry) => ({ userId: entry.user.id, displayName: entry.user.displayName }));
    if (input.recipientType === 'queue') return users.filter((entry) => entry.user.defaultTenantId === input.tenantId && (input.recipientId.includes('finance') ? entry.roleAssignments.some((role) => role.roleId === 'role_tenant_admin') : true)).map((entry) => ({ userId: entry.user.id, displayName: entry.user.displayName }));
    return users.map((entry) => ({ userId: entry.user.id, displayName: entry.user.displayName }));
  }
}
