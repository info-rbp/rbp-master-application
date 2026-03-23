export type AuditActorType = 'user' | 'system' | 'service' | 'workflow';
export type AuditOutcome = 'success' | 'failure' | 'partial' | 'denied';
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditSensitivity = 'low' | 'internal' | 'confidential' | 'restricted';
export type AuditCategory = 'authentication' | 'authorisation' | 'tenancy' | 'workflow' | 'data_access' | 'data_change' | 'support' | 'finance' | 'compliance' | 'document' | 'notification' | 'admin' | 'security' | 'system';

export type AuditEntityRef = { entityType: string; entityId: string };

export type AuditEvent = {
  id: string;
  eventType: string;
  action: string;
  category: AuditCategory;
  timestamp: string;
  tenantId: string;
  workspaceId?: string;
  actorType: AuditActorType;
  actorId?: string;
  actorDisplay?: string;
  subjectEntityType?: string;
  subjectEntityId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  relatedEntityRefs: AuditEntityRef[];
  sourceSystem: 'platform' | 'odoo' | 'lending' | 'marble' | 'n8n' | 'docspell';
  sourceRef?: Record<string, unknown>;
  requestId?: string;
  correlationId: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  reason?: string;
  metadata: Record<string, unknown>;
  beforeRef?: Record<string, unknown>;
  afterRef?: Record<string, unknown>;
  sensitivity: AuditSensitivity;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditRecordInput = Omit<AuditEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string };
export type AuditQueryInput = { tenantId: string; workspaceId?: string; actorId?: string; category?: AuditCategory; eventType?: string; subjectEntityType?: string; subjectEntityId?: string; targetEntityType?: string; targetEntityId?: string; outcome?: AuditOutcome; dateFrom?: string; dateTo?: string; limit?: number; cursor?: string };
export type AuditEventDto = AuditEvent;
export type AuditListDto = { items: AuditEventDto[]; pagination: { limit: number; total: number; nextCursor?: string } };
export type AuditQueryFiltersDto = AuditQueryInput;
