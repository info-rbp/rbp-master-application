import { NotificationCenter } from '@/components/notifications/notification-center';

export default function AdminNotificationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Admin Alerts</h2>
      <NotificationCenter />
    </div>
  );
}
