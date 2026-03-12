import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomisationRequestAllowance } from '@/lib/entitlements';
import { countMemberRequestsThisMonth, getMemberOverview, listCustomisationRequests } from '@/lib/member-dashboard';
import { requireMemberAuth } from '../_lib/member-auth';
import { SimpleRequestForm } from '../components/member-forms';

export default async function CustomisationRequestsPage() {
  const auth = await requireMemberAuth();
  const [overview, requests, usedThisMonth] = await Promise.all([
    getMemberOverview(auth.userId),
    listCustomisationRequests(auth.userId),
    countMemberRequestsThisMonth(auth.userId),
  ]);
  const allowance = getCustomisationRequestAllowance(overview.tier);
  const remaining = allowance === 'unlimited' ? 'Unlimited' : String(Math.max(0, allowance - usedThisMonth));
  const isBlocked = allowance !== 'unlimited' && allowance <= usedThisMonth;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Submit customisation request</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Allowance this month: {String(allowance)}. Remaining: {remaining}.</p>
          <SimpleRequestForm
            action="/api/member/customisation-requests"
            disabledText={isBlocked ? 'Monthly customisation allowance reached. Upgrade for higher capacity.' : undefined}
            fields={[{ key: 'requestDescription', label: 'Request description' }, { key: 'relatedResourceId', label: 'Related resource ID (optional)' }]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Active and historical requests</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {requests.map((request) => <li key={request.id} className="border rounded p-2">{request.status} — {request.requestDescription}</li>)}
            {requests.length === 0 ? <li className="text-muted-foreground">No requests yet.</li> : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
