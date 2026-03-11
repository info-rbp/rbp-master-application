import { firestore } from '@/firebase/server';
import { NotificationCenter } from '@/components/notifications/notification-center';

export default async function AdminNotificationsPage() {
  const failedEmailLogs = await firestore
    .collection('email_logs')
    .where('status', 'in', ['failed', 'skipped'])
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Admin Alerts</h2>
      <NotificationCenter />
      <section className="space-y-2">
        <h3 className="text-xl font-semibold">Recent email delivery issues</h3>
        {failedEmailLogs.docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent email failures.</p>
        ) : (
          failedEmailLogs.docs.map((doc) => {
            const log = doc.data();
            return (
              <div key={doc.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{String(log.subject ?? 'Email delivery issue')}</p>
                <p className="text-muted-foreground">
                  {String(log.status)} • {String(log.recipient ?? '-')} • {String(log.triggerSource ?? 'unknown')}
                </p>
                <p className="text-muted-foreground">{String(log.errorMessage ?? log.reason ?? 'No reason')}</p>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
