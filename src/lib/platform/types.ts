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

export type ModuleCategory =
  | 'foundation'
  | 'customer'
  | 'finance'
  | 'support'
  | 'knowledge'
  | 'services'
  | 'operations'
  | 'analytics'
  | 'admin'
  | 'marketing'
  | 'hr'
  | 'security';

export type ModuleKey =
  | 'home'
  | 'dashboard'
  | 'customers'
  | 'applications'
  | 'documents'
  | 'finance'
  | 'support'
  | 'knowledge'
  | 'services'
  | 'analytics'
  | 'settings'
  | 'admin'
  | 'membership'
  | 'billing'
  | 'offers'
  | 'docushare'
  | 'help'
  | 'profile';

export type NavigationGroupKey = 'primary' | 'workspace' | 'admin' | 'user' | 'public' | 'secondary';

export type ModuleDefinition = {
  key: ModuleKey;
  name: string;
  description: string;
  category: ModuleCategory;
  route: string;
  icon?: string;
  order: number;
  isEnabledByDefault: boolean;
  isHidden: boolean;
  isInternalOnly: boolean;
  isBeta: boolean;
  requiredPermissions: Array<{ resource: string; action: string }>;
  requiredFeatureFlags: string[];
  requiredTenantCapabilities: string[];
  allowedWorkspaceTypes: string[];
  children: ModuleKey[];
  defaultLandingRoute: string;
  navGroup: NavigationGroupKey;
  tags: string[];
  badges?: Array<{ key: string; label: string; variant?: 'info' | 'warning' | 'success' }>;
};

export type NavigationItem = {
  id: string;
  label: string;
  type: 'module' | 'route' | 'group' | 'action';
  route: string;
  icon?: string;
  moduleKey: ModuleKey;
  visible: boolean;
  disabled: boolean;
  order: number;
  badge?: string;
  children: NavigationItem[];
  meta: {
    isBeta?: boolean;
    isExternal?: boolean;
    tooltip?: string;
    requiresAttention?: boolean;
    count?: number;
    navGroup?: NavigationGroupKey;
  };
};

export type RouteDefinition = {
  id: string;
  path: string;
  moduleKey: ModuleKey;
  routeType: 'public' | 'authenticated' | 'tenant' | 'internal' | 'admin';
  label: string;
  requiredPermissions: Array<{ resource: string; action: string }>;
  requiredFeatureFlags: string[];
  requiredTenantCapabilities: string[];
  requiredModules: ModuleKey[];
  allowAnonymous: boolean;
  hideFromNav: boolean;
  parentRouteId?: string;
  navGroup?: NavigationGroupKey;
  isDefaultLanding: boolean;
  isEnabled: boolean;
  order: number;
  icon?: string;
  accessDeniedBehavior: 'redirect' | 'render_access_denied' | 'hide';
  matchPrefixes?: string[];
};

export type ModuleAccessResult = {
  moduleKey: ModuleKey;
  exists: boolean;
  enabledForTenant: boolean;
  enabledByFeatureFlags: boolean;
  allowedByPermissions: boolean;
  allowedByWorkspace: boolean;
  hidden: boolean;
  internalOnly: boolean;
  visible: boolean;
  accessible: boolean;
  reasonCodes: string[];
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
  enabledModules: ModuleKey[];
  navigation: NavigationItem[];
  featureFlags: Record<string, boolean>;
  securityContext: SecurityContext;
  issuedAt: string;
  expiresAt: string;
};

export type NavigationContext = {
  session: PlatformSession | null;
  activeTenant?: Tenant;
  activeWorkspace?: Workspace;
  effectivePermissions: PermissionGrant[];
  enabledModules: ModuleKey[];
  featureFlags: Record<string, boolean>;
  internalUser: boolean;
  currentRoute?: string;
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
