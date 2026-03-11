import { firestore } from '@/firebase/server';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export type NotificationType =
  | 'welcome'
  | 'verification_reminder'
  | 'membership_expiring'
  | 'membership_expired'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'subscription_reactivated'
  | 'resource_published'
  | 'announcement'
  | 'account_access_changed'
  | 'new_contact_enquiry'
  | 'membership_override'
  | 'member_status_changed'
  | 'failed_email_send'
  | 'failed_automation_trigger'
  | 'new_signup'
  | 'system';

export type NotificationAudienceType = 'direct' | 'role' | 'global';

export type AppNotification = {
  id: string;
  userId?: string;
  audienceRole?: 'member' | 'admin' | 'all';
  audienceType: NotificationAudienceType;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  severity: NotificationSeverity;
  read: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};


export function computeUnreadCount(items: Array<Pick<AppNotification, 'read'>>) {
  return items.filter((item) => !item.read).length;
}

const normalizeDate = (value: unknown) => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

export async function createNotification(input: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'readAt'>) {
  const ref = await firestore.collection('notifications').add({
    ...input,
    read: false,
    createdAt: new Date(),
    readAt: null,
    metadata: input.metadata ?? {},
  });

  return ref.id;
}

export async function listNotificationsForActor(input: { userId: string; role: 'member' | 'admin' }) {
  const userQuery = firestore.collection('notifications').where('userId', '==', input.userId).get();
  const roleQuery = firestore.collection('notifications').where('audienceRole', 'in', [input.role, 'all']).get();

  const [userSnap, roleSnap] = await Promise.all([userQuery, roleQuery]);
  const map = new Map<string, AppNotification>();

  [...userSnap.docs, ...roleSnap.docs].forEach((doc) => {
    const data = doc.data();
    map.set(doc.id, {
      id: doc.id,
      userId: data.userId,
      audienceRole: data.audienceRole,
      audienceType: data.audienceType ?? (data.userId ? 'direct' : 'role'),
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      createdAt: normalizeDate(data.createdAt),
      read: Boolean(data.read),
      readAt: data.readAt ? normalizeDate(data.readAt) : undefined,
      severity: data.severity ?? 'info',
      metadata: data.metadata ?? {},
    });
  });

  return [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getUnreadNotificationCount(input: { userId: string; role: 'member' | 'admin' }) {
  const items = await listNotificationsForActor(input);
  return computeUnreadCount(items);
}

export async function markNotificationRead(notificationId: string) {
  await firestore.doc(`notifications/${notificationId}`).update({
    read: true,
    readAt: new Date(),
  });
}

export async function markAllNotificationsReadForActor(input: { userId: string; role: 'member' | 'admin' }) {
  const items = await listNotificationsForActor(input);
  const unreadIds = items.filter((item) => !item.read).map((item) => item.id);

  const batch = firestore.batch();
  unreadIds.forEach((id) => {
    batch.update(firestore.doc(`notifications/${id}`), {
      read: true,
      readAt: new Date(),
    });
  });

  if (unreadIds.length > 0) {
    await batch.commit();
  }
}
