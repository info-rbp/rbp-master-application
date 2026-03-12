import { getServiceRequests } from '@/lib/admin-operations';
import { RequestQueue } from '../request-queue';

export default async function AdminDiscoveryCallsPage() {
  const rows = await getServiceRequests('discovery_call');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><h2 className="text-3xl font-bold tracking-tight">Discovery Calls</h2><RequestQueue title="Discovery calls" workflowType="discovery_call" rows={rows} /></div>;
}
