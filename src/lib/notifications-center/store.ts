import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Notification, NotificationPreference } from '@/lib/notifications-center/types';

type NotificationStoreState = { notifications: Notification[]; preferences: NotificationPreference[] };
const emptyState = (): NotificationStoreState => ({ notifications: [], preferences: [] });

export class NotificationStore {
  constructor(private readonly filePath = process.env.RBP_NOTIFICATION_STORE_PATH ?? path.join(process.cwd(), '.rbp-data', 'notification-store.json')) {}
  private async ensureFile() { await mkdir(path.dirname(this.filePath), { recursive: true }); try { await readFile(this.filePath, 'utf8'); } catch { await writeFile(this.filePath, JSON.stringify(emptyState(), null, 2), 'utf8'); } }
  async read() { await this.ensureFile(); return JSON.parse(await readFile(this.filePath, 'utf8')) as NotificationStoreState; }
  async write(state: NotificationStoreState) { await this.ensureFile(); await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8'); }
  async saveNotification(notification: Notification) { const state = await this.read(); const index = state.notifications.findIndex((item) => item.id === notification.id); if (index >= 0) state.notifications[index] = notification; else state.notifications.push(notification); await this.write(state); }
  async listNotifications() { return (await this.read()).notifications; }
  async getNotification(id: string) { return (await this.read()).notifications.find((item) => item.id === id) ?? null; }
  async findByDedupeKey(tenantId: string, recipientId: string, dedupeKey: string) { return (await this.read()).notifications.find((item) => item.tenantId === tenantId && item.recipientId === recipientId && item.dedupeKey === dedupeKey && item.status !== 'dismissed') ?? null; }
  async savePreference(preference: NotificationPreference) { const state = await this.read(); const index = state.preferences.findIndex((item) => item.id === preference.id); if (index >= 0) state.preferences[index] = preference; else state.preferences.push(preference); await this.write(state); }
  async listPreferences() { return (await this.read()).preferences; }
  async reset() { await this.write(emptyState()); }
}

let notificationStore: NotificationStore | null = null;
export function getNotificationStore() { notificationStore ??= new NotificationStore(); return notificationStore; }
export function resetNotificationStoreForTests() { notificationStore = null; }
