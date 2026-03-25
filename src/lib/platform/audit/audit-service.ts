import { getPlatformDb } from '../persistence/firestore-client';
import type { AuditEvent, AuditEventType } from './audit-types';

const COLLECTION = 'platform_audit_events';

function collection() {
  return getPlatformDb().collection(COLLECTION);
}

export async function recordAuditEvent(input: {
  eventType: AuditEventType;
  actorId?: string;
  actorEmail?: string;
  actorType?: AuditEvent['actorType'];
  sessionId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  outcome?: AuditEvent['outcome'];
  correlationId?: string;
}): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    eventType: input.eventType,
    timestamp: new Date().toISOString(),
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorType: input.actorType ?? 'system',
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    details: input.details ?? {},
    outcome: input.outcome ?? 'success',
    correlationId: input.correlationId,
  };

  try {
    await collection().doc(event.id).set(event);
  } catch (error) {
    console.error('[audit] Failed to persist audit event', event.eventType, error);
  }
  return event;
}

export async function queryAuditEvents(filters: {
  eventType?: AuditEventType;
  actorId?: string;
  sessionId?: string;
  tenantId?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  let query: FirebaseFirestore.Query = collection();
  if (filters.eventType) query = query.where('eventType', '==', filters.eventType);
  if (filters.actorId) query = query.where('actorId', '==', filters.actorId);
  if (filters.sessionId) query = query.where('sessionId', '==', filters.sessionId);
  if (filters.tenantId) query = query.where('tenantId', '==', filters.tenantId);
  const snap = await query.orderBy('timestamp', 'desc').limit(filters.limit ?? 100).get();
  return snap.docs.map((doc) => doc.data() as AuditEvent);
}
