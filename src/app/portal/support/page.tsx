import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canAccessImplementationSupport } from '@/lib/entitlements';
import { getMemberOverview, listSupportRequests } from '@/lib/member-dashboard';
import { requireMemberAuth } from '../_lib/member-auth';
import { SimpleRequestForm } from '../components/member-forms';

export default async function SupportRequestsPage() {
  const auth = await requireMemberAuth();
  const [overview, requests] = await Promise.all([getMemberOverview(auth.userId), listSupportRequests(auth.userId)]);
  const canSubmit = canAccessImplementationSupport(overview.tier);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Support requests</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Implementation support is {canSubmit ? 'included in your tier.' : 'Premium-only.'}</p>
          <SimpleRequestForm
            action="/api/member/support-requests"
            disabledText={canSubmit ? undefined : 'Upgrade to Premium to submit implementation support requests.'}
            fields={[{ key: 'description', label: 'Support request description' }, { key: 'requestType', label: 'Request type (implementation_support/general_support)' }]}
          />
          {!canSubmit ? <Link href="/membership" className="underline">View upgrade options</Link> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Your support history</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {requests.map((request) => <li key={request.id} className="border rounded p-2">{request.requestType} · {request.status}</li>)}
            {requests.length === 0 ? <li className="text-muted-foreground">No support requests yet.</li> : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
