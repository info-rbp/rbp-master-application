import { firestore } from '@/firebase/server';
import { getUnreadCount } from './wave3-helpers';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';
export type NotificationType =
  | 'membership'
  | 'payment'
  | 'resource'
  | 'enquiry'
  | 'system'
  | 'email_failure'
  | 'announcement';

export type AppNotification = {
  id: string;
  userId?: string;
  audienceRole?: 'member' | 'admin' | 'all';
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  severity: NotificationSeverity;
};

const normalizeDate = (value: unknown) => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

export async function createNotification(input: Omit<AppNotification, 'id' | 'createdAt' | 'readAt'>) {
  const ref = await firestore.collection('notifications').add({
    ...input,
    read: false,
    createdAt: new Date(),
    readAt: null,
  });

  return ref.id;
}

export async function listNotificationsForUser(userId: string, role: 'member' | 'admin') {
  const userQuery = firestore.collection('notifications').where('userId', '==', userId).get();
  const roleQuery = firestore
    .collection('notifications')
    .where('audienceRole', 'in', [role, 'all'])
    .get();

  const [userSnap, roleSnap] = await Promise.all([userQuery, roleQuery]);
  const map = new Map<string, AppNotification>();

  [...userSnap.docs, ...roleSnap.docs].forEach((doc) => {
    const data = doc.data();
    map.set(doc.id, {
      id: doc.id,
      userId: data.userId,
      audienceRole: data.audienceRole,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      createdAt: normalizeDate(data.createdAt),
      readAt: data.readAt ? normalizeDate(data.readAt) : undefined,
      severity: data.severity ?? 'info',
    });
  });

  return [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function markNotificationRead(notificationId: string) {
  await firestore.doc(`notifications/${notificationId}`).update({
    read: true,
    readAt: new Date(),
  });
}

export async function markAllNotificationsReadForUser(userId: string) {
  const snapshot = await firestore
    .collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) =>
    batch.update(doc.ref, {
      read: true,
      readAt: new Date(),
    }),
  );
  await batch.commit();
}


export { getUnreadCount };
