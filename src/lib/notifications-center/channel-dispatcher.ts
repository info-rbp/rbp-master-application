import type { Notification } from '@/lib/notifications-center/types';

export class NotificationChannelDispatcher {
  canDispatch(channel: 'in_app' | 'email' | 'sms' | 'chat', _notification: Notification) {
    return channel === 'in_app';
  }

  async dispatch(notification: Notification, recipient: { userId: string }, channel: 'in_app' | 'email' | 'sms' | 'chat') {
    if (channel !== 'in_app') {
      return { delivered: false, reason: 'channel_not_implemented' };
    }
    return { delivered: true, recipientId: recipient.userId, notificationId: notification.id };
  }
}
