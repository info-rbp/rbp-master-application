import { firestore } from '@/firebase/server';
import { requireAdminServerContext } from '@/lib/server-auth';

export default async function AdminEmailAutomationLogsPage() {
  await requireAdminServerContext();
  const snapshot = await firestore.collection('email_logs').orderBy('createdAt', 'desc').limit(100).get();

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Email / Automation Logs</h2>
      {snapshot.empty ? <p className="text-sm text-muted-foreground">No email logs available.</p> : snapshot.docs.map((doc) => {
        const data = doc.data();
        return (
          <div key={doc.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{String(data.templateKey ?? 'unknown_template')} • {String(data.status ?? 'unknown')}</p>
            <p className="text-xs text-muted-foreground">{String(data.recipient ?? 'unknown recipient')} • {String(data.createdAt ?? '')}</p>
          </div>
        );
      })}
    </div>
  );
}
