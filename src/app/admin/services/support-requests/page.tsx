import { getServiceRequests } from '@/lib/admin-operations';
import { RequestQueue } from '../request-queue';

export default async function AdminSupportRequestsPage() {
  const rows = await getServiceRequests('implementation_support');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><h2 className="text-3xl font-bold tracking-tight">Support Requests</h2><RequestQueue title="Implementation support queue" workflowType="implementation_support" rows={rows} /></div>;
}
