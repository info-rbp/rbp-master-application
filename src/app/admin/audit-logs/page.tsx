import { requireSessionForPath } from '@/lib/platform/server-guards';
import { AuditQueryService } from '@/lib/audit/query-service';

export default async function AdminAuditLogsPage() {
  const response = await requireSessionForPath('/admin/audit-logs');
  const service = new AuditQueryService();
  const data = await service.query({ correlationId: response.session.sessionId, session: response.session, internalUser: response.session.activeTenant.tenantType === 'internal' || response.session.availableTenants.some((tenant) => tenant.tenantType === 'internal') }, { limit: 100 });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      <div className="space-y-2">
        {data.items.map((item) => (
          <div key={item.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">{item.eventType}</p>
            <p className="text-muted-foreground">
              actor: {String(item.actorDisplay ?? item.actorId ?? '-')} | target: {String(item.subjectEntityType ?? '-')} / {String(item.subjectEntityId ?? '-')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
