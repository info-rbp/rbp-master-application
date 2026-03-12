import { getServiceRequests } from '@/lib/admin-operations';
import { RequestQueue } from '../request-queue';

export default async function AdminCustomisationRequestsPage() {
  const rows = await getServiceRequests('customisation');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><h2 className="text-3xl font-bold tracking-tight">Customisation Requests</h2><RequestQueue title="Customisation queue" workflowType="customisation" rows={rows} /></div>;
}
