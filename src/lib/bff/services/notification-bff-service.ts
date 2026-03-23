import type { NotificationListDto } from '@/lib/bff/dto/notification';
import { NotificationService } from '@/lib/notifications-center/service';
import { requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';

export class NotificationBffService {
  private readonly notifications = new NotificationService();

  async listNotifications(context: BffRequestContext, filters: { status?: 'read' | 'unread'; limit?: number } = {}): Promise<NotificationListDto> {
    requirePermission(context, 'dashboard', 'read');
    return this.notifications.listForUser({ tenantId: context.session.activeTenant.id, recipientId: context.session.user.id, status: filters.status, limit: filters.limit });
  }

  async markRead(context: BffRequestContext, id: string) {
    requirePermission(context, 'dashboard', 'read');
    const notification = await this.notifications.markRead(id, { tenantId: context.session.activeTenant.id, userId: context.session.user.id, correlationId: context.correlationId });
    return notification ? { id: notification.id, status: notification.status } : null;
  }

  async markAllRead(context: BffRequestContext) {
    requirePermission(context, 'dashboard', 'read');
    return this.notifications.markAllRead({ tenantId: context.session.activeTenant.id, userId: context.session.user.id, correlationId: context.correlationId });
  }
}
