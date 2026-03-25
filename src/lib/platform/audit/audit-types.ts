export type AuditEventType =
  | 'auth.login.initiated'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.callback.success'
  | 'auth.callback.failed'
  | 'auth.logout'
  | 'auth.token.refreshed'
  | 'auth.token.refresh_failed'
  | 'session.created'
  | 'session.restored'
  | 'session.expired'
  | 'session.tenant_switch'
  | 'session.tenant_switch_denied'
  | 'csrf.validation_failed'
  | 'principal.provisioned'
  | 'principal.updated'
  | 'tenant_membership.granted'
  | 'tenant_membership.revoked';

export type AuditEvent = {
  id: string;
  eventType: AuditEventType;
  timestamp: string;
  actorId?: string;
  actorEmail?: string;
  actorType: 'user' | 'system' | 'provider';
  sessionId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'denied';
  correlationId?: string;
};
