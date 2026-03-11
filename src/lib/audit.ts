import { firestore } from '@/firebase/server';

export type AuditActionType =
  | 'admin_login'
  | 'admin_content_create'
  | 'admin_content_update'
  | 'admin_content_delete'
  | 'membership_status_change'
  | 'membership_tier_change'
  | 'manual_access_override'
  | 'plan_create'
  | 'plan_update'
  | 'plan_delete'
  | 'announcement_create'
  | 'announcement_update'
  | 'announcement_delete'
  | 'notification_send_failure'
  | 'user_profile_admin_edit'
  | 'settings_change'
  | 'billing_webhook_processed';

export type AuditEvent = {
  actorUserId: string;
  actorRole: string;
  actionType: AuditActionType;
  targetId?: string;
  targetType?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(event: AuditEvent) {
  await firestore.collection('audit_logs').add({
    ...event,
    createdAt: new Date(),
  });
}

export async function saveContentRevision(input: {
  contentType: string;
  contentId: string;
  editorUserId: string;
  previousContent?: Record<string, unknown> | null;
  currentContent?: Record<string, unknown> | null;
}) {
  await firestore.collection('content_revisions').add({
    ...input,
    createdAt: new Date(),
  });
}

export async function logMembershipHistory(input: {
  userId: string;
  previousTier?: string;
  newTier?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  changedBy: string;
}) {
  await firestore.collection('membership_history').add({
    ...input,
    changedAt: new Date(),
  });
}
