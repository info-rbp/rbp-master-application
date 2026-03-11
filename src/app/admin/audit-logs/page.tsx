import { firestore } from '@/firebase/server';

export default async function AdminAuditLogsPage() {
  const snapshot = await firestore.collection('audit_logs').orderBy('createdAt', 'desc').limit(100).get();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      <div className="space-y-2">
        {snapshot.docs.map((doc) => {
          const item = doc.data();
          return (
            <div key={doc.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{String(item.actionType)}</p>
              <p className="text-muted-foreground">
                actor: {String(item.actorUserId ?? '-')} | target: {String(item.targetType ?? '-')}/{String(item.targetId ?? '-')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
