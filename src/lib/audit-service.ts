
import { firestore } from '@/firebase/server';

// Base interface for all audit events
interface AuditEventBase {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    role: string;
    ipAddress?: string;
  };
  action: string; // e.g., 'user.login', 'document.create'
  target: {
    id: string;
    type: string;
  };
  details?: Record<string, any>;
}

// Specific event types for better type safety
export interface UserAuditEvent extends AuditEventBase {
  action: 'user.login' | 'user.logout' | 'user.password.reset' | 'user.profile.update';
}

export interface DocumentAuditEvent extends AuditEventBase {
  action: 'document.create' | 'document.view' | 'document.update' | 'document.delete';
}

export interface AdminAuditEvent extends AuditEventBase {
  action: 'admin.access' | 'admin.settings.update';
}

export type AuditEvent = UserAuditEvent | DocumentAuditEvent | AdminAuditEvent;

const db = firestore;
const auditLogCollection = db.collection('audit_logs');

/**
 * Logs an audit event to Firestore.
 * @param event The audit event to log.
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
  const id = db.collection('_').doc().id; // Generate a new ID
  const timestamp = new Date().toISOString();
  const auditEvent: AuditEvent = {
    id,
    timestamp,
    ...event,
  };
  await auditLogCollection.doc(id).set(auditEvent);
}

/**
 * Retrieves audit logs based on a query.
 * @param query The query to filter audit logs.
 * @returns A list of audit events.
 */
export async function getAuditLogs(query: { 
  userId?: string; 
  action?: string; 
  targetId?: string; 
  limit?: number; 
}): Promise<AuditEvent[]> {
  let collectionQuery: FirebaseFirestore.Query = auditLogCollection;

  if (query.userId) {
    collectionQuery = collectionQuery.where('actor.id', '==', query.userId);
  }

  if (query.action) {
    collectionQuery = collectionQuery.where('action', '==', query.action);
  }

  if (query.targetId) {
    collectionQuery = collectionQuery.where('target.id', '==', query.targetId);
  }

  if (query.limit) {
    collectionQuery = collectionQuery.limit(query.limit);
  }

  const snapshot = await collectionQuery.orderBy('timestamp', 'desc').get();
  return snapshot.docs.map(doc => doc.data() as AuditEvent);
}
