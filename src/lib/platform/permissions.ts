import { findRoleById } from './bootstrap';
import type { PermissionGrant, Role, RoleAssignment, ScopeType } from './types';

export function resolveRoles(assignments: RoleAssignment[]): Role[] {
  return assignments
    .map((assignment) => findRoleById(assignment.roleId))
    .filter((role): role is Role => Boolean(role));
}

export function resolveEffectivePermissions(input: {
  roleAssignments: RoleAssignment[];
  activeTenantId: string;
  activeWorkspaceId?: string;
}): PermissionGrant[] {
  const relevantAssignments = input.roleAssignments.filter((assignment) => {
    if (!assignment.tenantId) return true;
    if (assignment.tenantId !== input.activeTenantId) return false;
    if (assignment.workspaceId && input.activeWorkspaceId && assignment.workspaceId !== input.activeWorkspaceId) return false;
    return true;
  });

  const permissionMap = new Map<string, PermissionGrant>();

  relevantAssignments.forEach((assignment) => {
    const role = findRoleById(assignment.roleId);
    role?.permissionGrants.forEach((grant) => {
      const key = `${grant.resource}:${grant.scope}:${JSON.stringify(grant.conditions ?? {})}`;
      const existing = permissionMap.get(key);
      if (existing) {
        permissionMap.set(key, {
          ...existing,
          actions: Array.from(new Set([...existing.actions, ...grant.actions])),
        });
      } else {
        permissionMap.set(key, { ...grant, actions: [...grant.actions] });
      }
    });
  });

  return [...permissionMap.values()];
}

export function canPermission(
  permissions: PermissionGrant[],
  resource: string,
  action: string,
  scope: ScopeType = 'tenant',
) {
  return permissions.some((permission) => {
    const scopeMatches = permission.scope === 'platform' || permission.scope === scope;
    const resourceMatches = permission.resource === '*' || permission.resource === resource;
    const actionMatches = permission.actions.includes(action) || permission.actions.includes('manage');
    return scopeMatches && resourceMatches && actionMatches;
  });
}
