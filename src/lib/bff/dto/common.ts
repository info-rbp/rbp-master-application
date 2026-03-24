import type { ModuleDefinition, NavigationItem, PermissionGrant, PlatformSession, RoleAssignment, SecurityContext, Tenant, UserIdentity, Workspace } from '@/lib/platform/types';
import type { SourceReference } from '@/lib/platform/integrations/types';

export type CanonicalStatusDto = {
  category: 'pending' | 'active' | 'completed' | 'attention' | 'inactive' | 'error' | 'unknown';
  code: string;
  label: string;
};

export type WarningDto = {
  code: string;
  message: string;
  sourceSystem?: SourceReference['sourceSystem'] | 'platform';
  retryable?: boolean;
  correlationId?: string;
  operation?: string;
};

export type QuickActionDto = {
  key: string;
  label: string;
  type: 'navigate' | 'api' | 'modal' | 'external';
  route?: string;
  actionKey?: string;
  requiresConfirmation: boolean;
  enabled: boolean;
  disabledReason?: string;
};

export type TimelineEventDto = {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  timestamp: string;
  actorType: 'system' | 'user' | 'workflow' | 'analyst';
  actorName?: string;
  sourceSystem: SourceReference['sourceSystem'] | 'platform';
  relatedEntityType?: string;
  relatedEntityId?: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  sourceRefs: SourceReference[];
};

export type SummaryCardDto = {
  key: string;
  label: string;
  value: string | number;
  trend?: string;
  status?: CanonicalStatusDto;
};

export type FinancialSummaryDto = {
  currency?: string;
  totalExposure?: number;
  outstandingAmount?: number;
  overdueAmount?: number;
  invoiceCount?: number;
  status?: CanonicalStatusDto;
  sourceRefs: SourceReference[];
};

export type ComplianceSummaryDto = {
  status: CanonicalStatusDto;
  riskLevel?: string;
  reasonCodes: string[];
  sourceRefs: SourceReference[];
};

export type DocumentSummaryDto = {
  total: number;
  uploaded: number;
  pending: number;
  items: Array<{ id: string; name: string; status: CanonicalStatusDto; uploadedAt?: string; sourceRefs: SourceReference[] }>;
};

export type TaskSummaryDto = {
  total: number;
  open: number;
  overdue: number;
  highPriority: number;
};

export type NotificationSummaryDto = {
  total: number;
  unread: number;
  highSeverity: number;
};

export type BffMeta = {
  correlationId: string;
  degraded?: boolean;
  generatedAt: string;
};

export type BffSuccessEnvelope<T> = {
  data: T;
  meta: BffMeta;
  links?: Record<string, string>;
  warnings?: WarningDto[];
};

export type BffErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  correlationId: string;
  retryable?: boolean;
};

export type SessionDto = {
  authenticated: boolean;
  sessionId?: string;
  user?: UserIdentity;
  activeTenant?: Tenant;
  activeWorkspace?: Workspace;
  availableTenants: Tenant[];
  availableWorkspaces: Workspace[];
  roleAssignments: RoleAssignment[];
  effectivePermissions: PermissionGrant[];
  enabledModules: ModuleDefinition['key'][];
  navigation: NavigationItem[];
  featureFlags: Record<string, boolean>;
  securityContext?: SecurityContext;
  issuedAt?: string;
  expiresAt?: string;
};

export function toSessionDto(session: PlatformSession | null): SessionDto {
  if (!session) {
    return {
      authenticated: false,
      availableTenants: [],
      availableWorkspaces: [],
      roleAssignments: [],
      effectivePermissions: [],
      enabledModules: [],
      navigation: [],
      featureFlags: {},
    };
  }

  return {
    authenticated: true,
    sessionId: session.sessionId,
    user: session.user,
    activeTenant: session.activeTenant,
    activeWorkspace: session.activeWorkspace,
    availableTenants: session.availableTenants,
    availableWorkspaces: session.availableWorkspaces,
    roleAssignments: session.roleAssignments,
    effectivePermissions: session.effectivePermissions,
    enabledModules: session.enabledModules,
    navigation: session.navigation,
    featureFlags: session.featureFlags,
    securityContext: session.securityContext,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  };
}
