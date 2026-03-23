import { AuditService } from '@/lib/audit/service';
import { NotificationService } from '@/lib/notifications-center/service';

export class PlatformEventPublisher {
  private readonly audit = new AuditService();
  private readonly notifications = new NotificationService();

  async publishAudit(input: Parameters<AuditService['record']>[0]) { return this.audit.record(input); }
  async publishNotification(input: Parameters<NotificationService['create']>[0]) { return this.notifications.create(input); }
}
