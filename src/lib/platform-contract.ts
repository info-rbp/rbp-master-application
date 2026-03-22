export type CanonicalEntityType =
  | 'user'
  | 'person'
  | 'organisation'
  | 'customer'
  | 'productOrService'
  | 'application'
  | 'accountOrFacility'
  | 'invoice'
  | 'payment'
  | 'document'
  | 'decision'
  | 'task'
  | 'ticketOrCase'
  | 'conversation'
  | 'appointment'
  | 'knowledgeItem'
  | 'tenant'
  | 'workspace'
  | 'role'
  | 'session'
  | 'navigationItem'
  | 'notification'
  | 'auditEvent';

export type CanonicalStatus = {
  category: string;
  code: string;
  label: string;
};

export type SourceRef = {
  system: string;
  recordType: string;
  recordId: string;
  isPrimary?: boolean;
  lastSyncedAt?: string;
};

export type RelationshipEdge = {
  type: string;
  targetEntityType: CanonicalEntityType;
  targetId: string;
};

export type CanonicalEntityEnvelope = {
  id: string;
  entityType: CanonicalEntityType;
  tenantId: string;
  workspaceId?: string;
  displayName: string;
  status: CanonicalStatus;
  sourceRefs: SourceRef[];
  relationships: RelationshipEdge[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  extensions: Record<string, Record<string, unknown>>;
};

export type CanonicalUser = CanonicalEntityEnvelope & {
  entityType: 'user';
  personId?: string;
  email: string;
  username?: string;
  authProviderRefs?: string[];
  defaultTenantId?: string;
  roleAssignments: string[];
  preferences?: Record<string, unknown>;
};

export type CanonicalPerson = CanonicalEntityEnvelope & {
  entityType: 'person';
  fullName: string;
  firstName?: string;
  lastName?: string;
  emails: string[];
  phones: string[];
  dateOfBirth?: string;
  addresses?: Array<Record<string, unknown>>;
  identifiers?: Array<Record<string, unknown>>;
};

export type CanonicalOrganisation = CanonicalEntityEnvelope & {
  entityType: 'organisation';
  legalName: string;
  tradingName?: string;
  registrationNumbers?: string[];
  addresses?: Array<Record<string, unknown>>;
  contacts?: string[];
  industry?: string;
  sizeBand?: string;
};

export type CanonicalCustomer = CanonicalEntityEnvelope & {
  entityType: 'customer';
  customerType: 'individual' | 'business' | 'household' | 'partner';
  personId?: string;
  organisationId?: string;
  lifecycleStage?: string;
  ownerUserId?: string;
  segment?: string;
  riskTier?: string;
  billingProfileId?: string;
  serviceProfileId?: string;
};

export type CanonicalApplication = CanonicalEntityEnvelope & {
  entityType: 'application';
  applicationType: string;
  customerId: string;
  subjectEntityType?: CanonicalEntityType;
  subjectEntityId?: string;
  submittedAt?: string;
  currentStage?: string;
  decisionStatus?: string;
  assignedTo?: string;
  requiredDocuments?: string[];
};

export type CanonicalAccountOrFacility = CanonicalEntityEnvelope & {
  entityType: 'accountOrFacility';
  facilityType: string;
  customerId: string;
  productId?: string;
  openedAt?: string;
  maturityAt?: string;
  financialSummary?: Record<string, unknown>;
  servicingState?: string;
};

export type CanonicalTask = CanonicalEntityEnvelope & {
  entityType: 'task';
  taskType: string;
  title: string;
  description?: string;
  sourceSystem?: string;
  sourceRef?: string;
  assignee?: {
    type: 'user' | 'team' | 'queue' | 'role';
    id: string;
  };
  queue?: string;
  relatedEntityType?: CanonicalEntityType;
  relatedEntityId?: string;
  dueAt?: string;
  sla?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  availableActions: string[];
};

export type CanonicalTenant = CanonicalEntityEnvelope & {
  entityType: 'tenant';
  name: string;
  slug: string;
  tenantType: 'internal' | 'customer' | 'partner' | 'sandbox';
  primaryOrganisationId?: string;
  enabledModules: string[];
  featureFlags: Record<string, boolean>;
  branding?: Record<string, unknown>;
  localisation?: Record<string, unknown>;
  complianceProfile?: Record<string, unknown>;
  billingPlan?: Record<string, unknown>;
  securityPolicy?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type CanonicalWorkspace = CanonicalEntityEnvelope & {
  entityType: 'workspace';
  tenantId: string;
  name: string;
  workspaceType: string;
  enabledModules: string[];
  defaultRoles: string[];
};

export type PermissionGrant = {
  resource: string;
  actions: string[];
  scope: 'platform' | 'tenant' | 'workspace';
  conditions?: Record<string, unknown>;
};

export type CanonicalRole = CanonicalEntityEnvelope & {
  entityType: 'role';
  code: string;
  name: string;
  description?: string;
  scopeType: 'platform' | 'tenant' | 'workspace';
  permissionGrants: PermissionGrant[];
  isSystemRole: boolean;
};

export type CanonicalSession = {
  sessionId: string;
  user: Pick<CanonicalUser, 'id' | 'displayName' | 'email'>;
  activeTenant: Pick<CanonicalTenant, 'id' | 'name'>;
  activeWorkspace?: Pick<CanonicalWorkspace, 'id' | 'name'>;
  roleAssignments: string[];
  effectivePermissions: PermissionGrant[];
  enabledModules: string[];
  featureFlags: Record<string, boolean>;
  navigationProfile?: string;
  preferences?: Record<string, unknown>;
  securityContext: {
    mfaVerified?: boolean;
    impersonating?: boolean;
    [key: string]: unknown;
  };
  issuedAt: string;
  expiresAt: string;
};

export type CanonicalNavigationItem = {
  id: string;
  type: 'module' | 'route' | 'group' | 'action';
  label: string;
  icon?: string;
  route?: string;
  moduleKey?: string;
  visibilityRules?: Record<string, unknown>;
  badge?: string;
  children?: CanonicalNavigationItem[];
  defaultLanding?: boolean;
  order?: number;
};

export type CanonicalNotification = CanonicalEntityEnvelope & {
  entityType: 'notification';
  notificationType: string;
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  recipientType: 'user' | 'role' | 'team' | 'queue';
  recipientId: string;
  relatedEntityType?: CanonicalEntityType;
  relatedEntityId?: string;
  sourceEventType?: string;
  sourceSystem?: string;
  channels: Array<'in_app' | 'email' | 'sms' | 'push' | 'chat'>;
  actions: string[];
  readAt?: string;
  expiresAt?: string;
  dedupeKey?: string;
};

export type CanonicalAuditEvent = CanonicalEntityEnvelope & {
  entityType: 'auditEvent';
  eventType: string;
  action: string;
  category:
    | 'authentication'
    | 'authorisation'
    | 'data_access'
    | 'data_change'
    | 'workflow'
    | 'compliance'
    | 'billing'
    | 'support'
    | 'system_admin'
    | 'security';
  timestamp: string;
  actorType: 'system' | 'user' | 'service';
  actorId?: string;
  subjectEntityType?: CanonicalEntityType;
  subjectEntityId?: string;
  targetEntityType?: CanonicalEntityType;
  targetEntityId?: string;
  sourceSystem?: string;
  requestId?: string;
  correlationId?: string;
  outcome: 'success' | 'failure' | 'partial' | 'denied';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeRef?: string;
  afterRef?: string;
  metadata?: Record<string, unknown>;
  sensitivity?: string;
};

export const PLATFORM_CONTRACT_V1_ENTITIES: CanonicalEntityType[] = [
  'user',
  'person',
  'organisation',
  'customer',
  'productOrService',
  'application',
  'accountOrFacility',
  'invoice',
  'payment',
  'document',
  'decision',
  'task',
  'ticketOrCase',
  'conversation',
  'appointment',
  'knowledgeItem',
  'tenant',
  'workspace',
  'role',
  'session',
  'navigationItem',
  'notification',
  'auditEvent',
];

export const PLATFORM_CONTRACT_PRINCIPLES = [
  'Canonical, not vendor-shaped',
  'Source-aware, but source-agnostic',
  'Tenant-scoped by default',
  'Extension-friendly',
  'Relationship-first',
  'Actionable',
] as const;

export const PLATFORM_STARTER_ROLE_CODES = [
  'platform.super_admin',
  'tenant.admin',
  'finance.manager',
  'finance.agent',
  'ops.manager',
  'ops.agent',
  'support.manager',
  'support.agent',
  'compliance.analyst',
  'sales.manager',
  'sales.agent',
  'service.coordinator',
  'hr.manager',
  'customer.primary_user',
  'customer.standard_user',
  'partner.broker',
  'viewer',
] as const;
