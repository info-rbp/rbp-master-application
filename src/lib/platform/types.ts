export type ScopeType = 'platform' | 'tenant' | 'workspace';
export type TenantType = 'internal' | 'customer' | 'partner' | 'sandbox';
export type RecordStatus = 'active' | 'inactive' | 'suspended' | 'invited';

export type UserIdentity = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  authProvider: 'authentik';
  authProviderUserId: string;
  status: RecordStatus;
  defaultTenantId?: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: RecordStatus;
  tenantType: TenantType;
  enabledModules: string[];
  featureFlags: Record<string, boolean>;
  branding: Record<string, unknown>;
  localisation: Record<string, unknown>;
  securityPolicy: Record<string, unknown>;
  settings: Record<string, unknown>;
};

export type Workspace = {
  id: string;
  tenantId: string;
  name: string;
  workspaceType: string;
  enabledModules: string[];
  status: RecordStatus;
};

export type PermissionGrant = {
  resource: string;
  actions: string[];
  scope: ScopeType;
  conditions?: Record<string, unknown>;
};

export type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
  scopeType: ScopeType;
  permissionGrants: PermissionGrant[];
  isSystemRole: boolean;
  status: RecordStatus;
};

export type RoleAssignment = {
  roleId: string;
  tenantId?: string;
  workspaceId?: string;
  assignedAt: string;
  assignedBy?: string;
};

export type ModuleDefinition = {
  key:
    | 'dashboard'
    | 'customers'
    | 'applications'
    | 'loans'
    | 'documents'
    | 'finance'
    | 'support'
    | 'analytics'
    | 'knowledge'
    | 'settings'
    | 'admin';
  name: string;
  description: string;
  category: 'core' | 'operations' | 'service' | 'intelligence' | 'system';
  route: string;
  icon?: string;
  requiredPermissions: Array<{ resource: string; action: string }>;
  requiredFeatureFlags: string[];
  isHidden: boolean;
  isInternalOnly: boolean;
  isEnabledByDefault: boolean;
  workspaceTypes?: string[];
};

export type NavigationItem = {
  id: string;
  label: string;
  route: string;
  moduleKey: ModuleDefinition['key'];
  icon?: string;
  type: 'route' | 'group' | 'action';
  visible: boolean;
  children: NavigationItem[];
};

export type SecurityContext = {
  mfaVerified: boolean;
  impersonating: boolean;
  sessionStrength: 'standard' | 'mfa' | 'elevated';
  provider: 'authentik';
  lastAuthenticatedAt: string;
};

export type PlatformSession = {
  sessionId: string;
  user: UserIdentity;
  activeTenant: Tenant;
  activeWorkspace?: Workspace;
  availableTenants: Tenant[];
  availableWorkspaces: Workspace[];
  roles: Role[];
  roleAssignments: RoleAssignment[];
  effectivePermissions: PermissionGrant[];
  enabledModules: ModuleDefinition['key'][];
  navigation: NavigationItem[];
  featureFlags: Record<string, boolean>;
  securityContext: SecurityContext;
  issuedAt: string;
  expiresAt: string;
};

export type PlatformSessionResponse =
  | { authenticated: false }
  | { authenticated: true; session: PlatformSession };

export type PersistedPlatformSession = {
  sessionId: string;
  user: UserIdentity;
  availableTenantIds: string[];
  activeTenantId: string;
  activeWorkspaceId?: string;
  roleAssignments: RoleAssignment[];
  issuedAt: string;
  expiresAt: string;
  securityContext: SecurityContext;
  auth: {
    provider: 'authentik' | 'local';
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    scope?: string;
    expiresAt?: string;
  };
};

export type AuthenticatedPrincipal = {
  user: UserIdentity;
  availableTenantIds: string[];
  roleAssignments: RoleAssignment[];
  defaultTenantId?: string;
  mfaVerified: boolean;
  lastAuthenticatedAt: string;
};
