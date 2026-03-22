import type { NotificationListDto } from '@/lib/bff/dto/notification';
import { getUnreadNotificationCount, listNotificationsForActor, markAllNotificationsReadForActor, markNotificationRead } from '@/lib/notifications';
import { requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';

export class NotificationBffService {
  async listNotifications(context: BffRequestContext, filters: { status?: 'read' | 'unread'; limit?: number } = {}): Promise<NotificationListDto> {
    requirePermission(context, 'dashboard', 'read');
    const role = context.internalUser ? 'admin' : 'member';
    const notifications = await listNotificationsForActor({ userId: context.session.user.id, role });
    const items = notifications
      .filter((item) => !filters.status || (filters.status === 'read' ? item.read : !item.read))
      .slice(0, filters.limit ?? 50)
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.message,
        severity: item.severity,
        status: item.read ? 'read' : 'unread',
        sourceSystem: 'platform',
        relatedEntityType: typeof item.metadata?.relatedEntityType === 'string' ? item.metadata.relatedEntityType : undefined,
        relatedEntityId: typeof item.metadata?.relatedEntityId === 'string' ? item.metadata.relatedEntityId : undefined,
        createdAt: item.createdAt,
        readAt: item.readAt,
        actions: item.actionUrl ? [{ key: 'open', label: 'Open', route: item.actionUrl }] : [],
        sourceRefs: [],
      }));

    return {
      items,
      summary: { total: notifications.length, unread: await getUnreadNotificationCount({ userId: context.session.user.id, role }), highSeverity: items.filter((item) => item.severity === 'error' || item.severity === 'warning').length },
      pagination: { limit: filters.limit ?? 50, total: items.length },
    };
  }

  async markRead(context: BffRequestContext, id: string) {
    requirePermission(context, 'dashboard', 'read');
    await markNotificationRead(id);
    return { id, status: 'read' as const };
  }

  async markAllRead(context: BffRequestContext) {
    requirePermission(context, 'dashboard', 'read');
    await markAllNotificationsReadForActor({ userId: context.session.user.id, role: context.internalUser ? 'admin' : 'member' });
    return { updated: true };
  }
}
