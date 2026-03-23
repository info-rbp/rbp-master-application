import type { AuthenticatedPrincipal, ModuleDefinition, Role, RoleAssignment, Tenant, UserIdentity, Workspace } from './types';

const now = '2026-03-22T10:00:00.000Z';

export const PLATFORM_TENANTS: Tenant[] = [
  {
    id: 'ten_rbp_internal',
    name: 'Remote Business Partner',
    slug: 'remote-business-partner',
    status: 'active',
    tenantType: 'internal',
    enabledModules: ['dashboard', 'customers', 'applications', 'loans', 'documents', 'finance', 'support', 'analytics', 'knowledge', 'settings', 'admin'],
    featureFlags: { analytics_embeds: true, admin_console: true, loan_variations: true },
    branding: { primaryColor: '#0f172a', logoText: 'RBP' },
    localisation: { locale: 'en-AU', timezone: 'Australia/Sydney' },
    securityPolicy: { requireMfa: true, sessionTtlMinutes: 480 },
    settings: { internalOnly: true },
  },
  {
    id: 'ten_acme_customer',
    name: 'Acme Advisory',
    slug: 'acme-advisory',
    status: 'active',
    tenantType: 'customer',
    enabledModules: ['dashboard', 'documents', 'support', 'knowledge', 'settings'],
    featureFlags: { analytics_embeds: false, admin_console: false, loan_variations: false },
    branding: { primaryColor: '#2563eb', logoText: 'Acme' },
    localisation: { locale: 'en-US', timezone: 'America/New_York' },
    securityPolicy: { requireMfa: false, sessionTtlMinutes: 480 },
    settings: { supportPortal: true },
  },
];

export const PLATFORM_WORKSPACES: Workspace[] = [
  {
    id: 'wrk_internal_ops',
    tenantId: 'ten_rbp_internal',
    name: 'Operations',
    workspaceType: 'operations',
    enabledModules: ['dashboard', 'customers', 'applications', 'loans', 'documents', 'support', 'analytics'],
    status: 'active',
  },
  {
    id: 'wrk_internal_admin',
    tenantId: 'ten_rbp_internal',
    name: 'Administration',
    workspaceType: 'admin',
    enabledModules: ['dashboard', 'finance', 'admin', 'analytics', 'settings'],
    status: 'active',
  },
  {
    id: 'wrk_acme_service',
    tenantId: 'ten_acme_customer',
    name: 'Client Workspace',
    workspaceType: 'customer_portal',
    enabledModules: ['dashboard', 'documents', 'support', 'knowledge', 'settings'],
    status: 'active',
  },
];

export const PLATFORM_ROLES: Role[] = [
  {
    id: 'role_platform_super_admin',
    code: 'platform.super_admin',
    name: 'Platform Super Admin',
    description: 'Full internal administrative access across the platform.',
    scopeType: 'platform',
    isSystemRole: true,
    status: 'active',
    permissionGrants: [
      { resource: '*', actions: ['read', 'create', 'update', 'delete', 'approve', 'assign', 'manage', 'export', 'preview'], scope: 'platform' },
    ],
  },
  {
    id: 'role_tenant_admin',
    code: 'tenant.admin',
    name: 'Tenant Admin',
    description: 'Manage tenant-scoped operations, settings, and users.',
    scopeType: 'tenant',
    isSystemRole: true,
    status: 'active',
    permissionGrants: [
      { resource: 'dashboard', actions: ['read'], scope: 'tenant' },
      { resource: 'customer', actions: ['read', 'create', 'update', 'export'], scope: 'tenant' },
      { resource: 'application', actions: ['read', 'create', 'update', 'approve'], scope: 'tenant' },
      { resource: 'loan', actions: ['read', 'create', 'update', 'approve'], scope: 'tenant' },
      { resource: 'document', actions: ['read', 'create', 'update'], scope: 'tenant' },
      { resource: 'finance', actions: ['read', 'manage', 'export'], scope: 'tenant' },
      { resource: 'support_ticket', actions: ['read', 'assign', 'manage'], scope: 'tenant' },
      { resource: 'analytics', actions: ['read', 'export'], scope: 'tenant' },
      { resource: 'knowledge', actions: ['read', 'update'], scope: 'tenant' },
      { resource: 'settings', actions: ['read', 'manage'], scope: 'tenant' },
      { resource: 'admin_user', actions: ['read', 'manage'], scope: 'tenant' },
      { resource: 'feature_flags', actions: ['read', 'manage'], scope: 'platform' },
      { resource: 'module_controls', actions: ['read', 'manage'], scope: 'platform' },
      { resource: 'rollout', actions: ['preview', 'manage'], scope: 'platform' },
      { resource: 'kill_switch', actions: ['manage'], scope: 'platform' },
      { resource: 'release_controls', actions: ['manage'], scope: 'platform' },
    ],
  },
  {
    id: 'role_support_agent',
    code: 'support.agent',
    name: 'Support Agent',
    description: 'Handle support cases and related customer documents.',
    scopeType: 'tenant',
    isSystemRole: true,
    status: 'active',
    permissionGrants: [
      { resource: 'dashboard', actions: ['read'], scope: 'tenant' },
      { resource: 'support_ticket', actions: ['read', 'assign', 'update'], scope: 'tenant' },
      { resource: 'document', actions: ['read'], scope: 'tenant' },
      { resource: 'knowledge', actions: ['read'], scope: 'tenant' },
    ],
  },
  {
    id: 'role_customer_user',
    code: 'customer.standard_user',
    name: 'Customer User',
    description: 'Standard customer portal user.',
    scopeType: 'tenant',
    isSystemRole: true,
    status: 'active',
    permissionGrants: [
      { resource: 'dashboard', actions: ['read'], scope: 'tenant' },
      { resource: 'document', actions: ['read'], scope: 'tenant' },
      { resource: 'support_ticket', actions: ['read', 'create'], scope: 'tenant' },
      { resource: 'knowledge', actions: ['read'], scope: 'tenant' },
      { resource: 'settings', actions: ['read', 'update'], scope: 'tenant' },
    ],
  },
  {
    id: 'role_analytics_viewer',
    code: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboards and analytics.',
    scopeType: 'tenant',
    isSystemRole: true,
    status: 'active',
    permissionGrants: [
      { resource: 'dashboard', actions: ['read'], scope: 'tenant' },
      { resource: 'analytics', actions: ['read'], scope: 'tenant' },
    ],
  },
];

export const PLATFORM_MODULES: ModuleDefinition[] = [
  { key: 'dashboard', name: 'Dashboard', description: 'Platform home and operational summary.', category: 'core', route: '/dashboard', icon: 'LayoutDashboard', requiredPermissions: [{ resource: 'dashboard', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'customers', name: 'Customers', description: 'Customer relationship and account views.', category: 'operations', route: '/admin/crm', icon: 'Users', requiredPermissions: [{ resource: 'customer', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: true, isEnabledByDefault: true },
  { key: 'applications', name: 'Applications', description: 'Application intake and workflow.', category: 'operations', route: '/admin/services/discovery-calls', icon: 'FileText', requiredPermissions: [{ resource: 'application', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: true, isEnabledByDefault: true },
  { key: 'loans', name: 'Loans', description: 'Account/facility and lending servicing.', category: 'operations', route: '/admin/services/customisation-requests', icon: 'BadgeDollarSign', requiredPermissions: [{ resource: 'loan', action: 'read' }], requiredFeatureFlags: ['loan_variations'], isHidden: false, isInternalOnly: true, isEnabledByDefault: false },
  { key: 'documents', name: 'Documents', description: 'Document access and lifecycle management.', category: 'service', route: '/portal/saved', icon: 'FileText', requiredPermissions: [{ resource: 'document', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'finance', name: 'Finance', description: 'Billing and finance operations.', category: 'operations', route: '/admin/membership/subscription-and-billing-oversight', icon: 'BadgeDollarSign', requiredPermissions: [{ resource: 'finance', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: true, isEnabledByDefault: true },
  { key: 'support', name: 'Support', description: 'Support cases, tickets, and follow-up.', category: 'service', route: '/portal/support', icon: 'LifeBuoy', requiredPermissions: [{ resource: 'support_ticket', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'analytics', name: 'Analytics', description: 'Dashboards and reporting.', category: 'intelligence', route: '/admin/analytics', icon: 'LineChart', requiredPermissions: [{ resource: 'analytics', action: 'read' }], requiredFeatureFlags: ['analytics_embeds'], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'knowledge', name: 'Knowledge', description: 'Knowledge center and operational documentation.', category: 'service', route: '/knowledge-center', icon: 'BookOpen', requiredPermissions: [{ resource: 'knowledge', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'settings', name: 'Settings', description: 'Profile, security, and tenant settings.', category: 'system', route: '/settings/profile', icon: 'Settings', requiredPermissions: [{ resource: 'settings', action: 'read' }], requiredFeatureFlags: [], isHidden: false, isInternalOnly: false, isEnabledByDefault: true },
  { key: 'admin', name: 'Admin', description: 'Internal administrative console.', category: 'system', route: '/admin', icon: 'ShieldCheck', requiredPermissions: [{ resource: 'admin_user', action: 'read' }], requiredFeatureFlags: ['admin_console'], isHidden: false, isInternalOnly: true, isEnabledByDefault: true },
];

const seededUsers: Array<{ user: UserIdentity; roleAssignments: RoleAssignment[]; tenantIds: string[]; groups?: string[] }> = [
  {
    user: {
      id: 'usr_jane_admin',
      email: 'admin@rbp.local',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      authProvider: 'authentik',
      authProviderUserId: 'authentik-jane-smith',
      status: 'active',
      defaultTenantId: 'ten_rbp_internal',
    },
    tenantIds: ['ten_rbp_internal', 'ten_acme_customer'],
    roleAssignments: [
      { roleId: 'role_platform_super_admin', assignedAt: now, assignedBy: 'system' },
      { roleId: 'role_tenant_admin', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_admin', assignedAt: now, assignedBy: 'system' },
      { roleId: 'role_support_agent', tenantId: 'ten_rbp_internal', workspaceId: 'wrk_internal_ops', assignedAt: now, assignedBy: 'system' },
      { roleId: 'role_customer_user', tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service', assignedAt: now, assignedBy: 'system' },
    ],
    groups: ['platform.super_admin', 'tenant.admin'],
  },
  {
    user: {
      id: 'usr_alex_client',
      email: 'member@rbp.local',
      displayName: 'Alex Customer',
      firstName: 'Alex',
      lastName: 'Customer',
      authProvider: 'authentik',
      authProviderUserId: 'authentik-alex-customer',
      status: 'active',
      defaultTenantId: 'ten_acme_customer',
    },
    tenantIds: ['ten_acme_customer'],
    roleAssignments: [
      { roleId: 'role_customer_user', tenantId: 'ten_acme_customer', workspaceId: 'wrk_acme_service', assignedAt: now, assignedBy: 'system' },
    ],
    groups: ['customer.standard_user'],
  },
];

export function listPlatformTenants() {
  return PLATFORM_TENANTS;
}

export function listPlatformWorkspaces() {
  return PLATFORM_WORKSPACES;
}

export function listPlatformRoles() {
  return PLATFORM_ROLES;
}

export function listModuleDefinitions() {
  return PLATFORM_MODULES;
}

export function getTenantById(tenantId: string) {
  return PLATFORM_TENANTS.find((tenant) => tenant.id === tenantId);
}

export function getWorkspacesForTenant(tenantId: string) {
  return PLATFORM_WORKSPACES.filter((workspace) => workspace.tenantId === tenantId);
}

export function findRoleById(roleId: string) {
  return PLATFORM_ROLES.find((role) => role.id === roleId);
}

export function findBootstrapUserByEmail(email: string) {
  return seededUsers.find((entry) => entry.user.email.toLowerCase() === email.toLowerCase());
}

export function findBootstrapUserByProviderId(providerUserId: string) {
  return seededUsers.find((entry) => entry.user.authProviderUserId === providerUserId);
}

export function listBootstrapUsers() {
  return seededUsers;
}

export function findBootstrapUserById(userId: string) {
  return seededUsers.find((entry) => entry.user.id === userId);
}

export function resolvePrincipalFromBootstrap(input: { email?: string; providerUserId?: string; groups?: string[] }): AuthenticatedPrincipal | null {
  const seeded =
    (input.providerUserId ? findBootstrapUserByProviderId(input.providerUserId) : null) ??
    (input.email ? findBootstrapUserByEmail(input.email) : null);

  if (!seeded) return null;

  const groupCodes = new Set(input.groups ?? seeded.groups ?? []);
  const roleAssignments = seeded.roleAssignments.filter((assignment) => {
    const role = findRoleById(assignment.roleId);
    return role ? groupCodes.size === 0 || groupCodes.has(role.code) || role.code === 'customer.standard_user' : false;
  });

  return {
    user: seeded.user,
    availableTenantIds: seeded.tenantIds,
    roleAssignments: roleAssignments.length > 0 ? roleAssignments : seeded.roleAssignments,
    defaultTenantId: seeded.user.defaultTenantId,
    mfaVerified: groupCodes.has('platform.super_admin') || seeded.user.defaultTenantId === 'ten_rbp_internal',
    lastAuthenticatedAt: now,
  };
}
