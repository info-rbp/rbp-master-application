import { getServiceRequests } from '@/lib/admin-operations';
import { RequestQueue } from '../request-queue';

export default async function AdminStrategicCheckupsPage() {
  const rows = await getServiceRequests('strategic_checkup');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><h2 className="text-3xl font-bold tracking-tight">Strategic Check-Ups</h2><RequestQueue title="Strategic check-ups" workflowType="strategic_checkup" rows={rows} /></div>;
}
