import { getNotificationStore } from '@/lib/notifications-center/store';
import type { CreateNotificationInput, Notification, NotificationListDto, NotificationPreference, NotificationQueryInput, NotificationSummaryDto, UpdateNotificationPreferenceInput } from '@/lib/notifications-center/types';
import { RecipientResolver } from '@/lib/notifications-center/recipient-resolver';
import { NotificationChannelDispatcher } from '@/lib/notifications-center/channel-dispatcher';
import { AuditService } from '@/lib/audit/service';

export class NotificationService {
  private readonly store = getNotificationStore();
  private readonly resolver = new RecipientResolver();
  private readonly dispatcher = new NotificationChannelDispatcher();
  private readonly audit = new AuditService();

  async create(input: CreateNotificationInput): Promise<Notification[]> {
    const recipients = await this.resolver.resolve({ tenantId: input.tenantId, workspaceId: input.workspaceId, recipientType: input.recipientType, recipientId: input.recipientId, recipientScope: input.recipientScope });
    const created: Notification[] = [];
    for (const recipient of recipients) {
      if (input.dedupeKey) {
        const existing = await this.store.findByDedupeKey(input.tenantId, recipient.userId, input.dedupeKey);
        if (existing) { created.push(existing); continue; }
      }
      const notification: Notification = { ...input, id: input.id ?? `ntf_${crypto.randomUUID()}`, recipientId: recipient.userId, status: input.status ?? 'delivered', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await this.store.saveNotification(notification);
      for (const channel of notification.channels) {
        if (this.dispatcher.canDispatch(channel, notification)) await this.dispatcher.dispatch(notification, recipient, channel);
      }
      await this.audit.record({ eventType: 'notification.created', action: 'create', category: 'notification', tenantId: notification.tenantId, workspaceId: notification.workspaceId, actorType: 'system', actorDisplay: 'NotificationService', subjectEntityType: 'notification', subjectEntityId: notification.id, relatedEntityRefs: notification.relatedEntityId ? [{ entityType: notification.relatedEntityType ?? 'entity', entityId: notification.relatedEntityId }] : [], sourceSystem: 'platform', correlationId: String(notification.metadata.correlationId ?? crypto.randomUUID()), outcome: 'success', severity: 'info', metadata: { notificationType: notification.notificationType, recipientId: recipient.userId }, sensitivity: 'internal' });
      created.push(notification);
    }
    return created;
  }

  async createMany(inputs: CreateNotificationInput[]) { return (await Promise.all(inputs.map((item) => this.create(item)))).flat(); }

  async listForUser(query: NotificationQueryInput): Promise<NotificationListDto> {
    const limit = query.limit ?? 50;
    const all = (await this.store.listNotifications())
      .filter((item) => item.tenantId === query.tenantId && item.recipientId === query.recipientId)
      .filter((item) => !query.status || (query.status === 'read' ? item.status === 'read' : item.status !== 'read'))
      .filter((item) => !query.category || item.category === query.category)
      .filter((item) => !query.notificationType || item.notificationType === query.notificationType)
      .filter((item) => !query.severity || item.severity === query.severity)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const offset = query.cursor ? Number(query.cursor) : 0;
    const items = all.slice(offset, offset + limit);
    return { items, summary: this.buildSummary(all), pagination: { limit, total: all.length, nextCursor: offset + limit < all.length ? String(offset + limit) : undefined } };
  }

  async markRead(notificationId: string, context: { tenantId: string; userId: string; correlationId: string }) {
    const notification = await this.store.getNotification(notificationId);
    if (!notification || notification.tenantId !== context.tenantId || notification.recipientId !== context.userId) return null;
    notification.status = 'read'; notification.readAt = new Date().toISOString(); notification.updatedAt = notification.readAt;
    await this.store.saveNotification(notification);
    await this.audit.record({ eventType: 'notification.read', action: 'mark_read', category: 'notification', tenantId: context.tenantId, actorType: 'user', actorId: context.userId, subjectEntityType: 'notification', subjectEntityId: notificationId, relatedEntityRefs: [], sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: 'info', metadata: {}, sensitivity: 'low' });
    return notification;
  }

  async markAllRead(context: { tenantId: string; userId: string; correlationId: string }) {
    const notifications = (await this.store.listNotifications()).filter((item) => item.tenantId === context.tenantId && item.recipientId === context.userId && item.status !== 'read');
    for (const notification of notifications) {
      notification.status = 'read'; notification.readAt = new Date().toISOString(); notification.updatedAt = notification.readAt; await this.store.saveNotification(notification);
    }
    await this.audit.record({ eventType: 'notification.read', action: 'mark_all_read', category: 'notification', tenantId: context.tenantId, actorType: 'user', actorId: context.userId, relatedEntityRefs: [], sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: 'info', metadata: { count: notifications.length }, sensitivity: 'low' });
    return { updated: notifications.length };
  }

  async dismiss(notificationId: string, context: { tenantId: string; userId: string; correlationId: string }) {
    const notification = await this.store.getNotification(notificationId);
    if (!notification || notification.tenantId !== context.tenantId || notification.recipientId !== context.userId) return null;
    notification.status = 'dismissed'; notification.dismissedAt = new Date().toISOString(); notification.updatedAt = notification.dismissedAt;
    await this.store.saveNotification(notification);
    await this.audit.record({ eventType: 'notification.dismissed', action: 'dismiss', category: 'notification', tenantId: context.tenantId, actorType: 'user', actorId: context.userId, subjectEntityType: 'notification', subjectEntityId: notificationId, relatedEntityRefs: [], sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: 'info', metadata: {}, sensitivity: 'low' });
    return notification;
  }

  async getUnreadCount(context: { tenantId: string; userId: string }): Promise<NotificationSummaryDto> {
    const items = (await this.store.listNotifications()).filter((item) => item.tenantId === context.tenantId && item.recipientId === context.userId);
    return this.buildSummary(items);
  }

  async getPreferences(userId: string, tenantId: string) {
    const prefs = (await this.store.listPreferences()).filter((item) => item.userId === userId && item.tenantId === tenantId);
    if (prefs.length > 0) return prefs;
    const preference: NotificationPreference = { id: `np_${crypto.randomUUID()}`, tenantId, userId, channelPreferences: { in_app: true, email: false, sms: false, chat: false }, muted: false, digestMode: 'instant', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await this.store.savePreference(preference);
    return [preference];
  }

  async updatePreferences(userId: string, tenantId: string, payload: UpdateNotificationPreferenceInput) {
    const existing = (await this.getPreferences(userId, tenantId))[0];
    const updated: NotificationPreference = { ...existing, notificationType: payload.notificationType ?? existing.notificationType, category: payload.category ?? existing.category, channelPreferences: { ...existing.channelPreferences, ...payload.channelPreferences }, muted: payload.muted ?? existing.muted, digestMode: payload.digestMode ?? existing.digestMode, updatedAt: new Date().toISOString() };
    await this.store.savePreference(updated);
    return updated;
  }

  private buildSummary(items: Notification[]) { return { total: items.length, unread: items.filter((item) => item.status !== 'read').length, highSeverity: items.filter((item) => item.severity === 'error' || item.severity === 'critical').length }; }
}
