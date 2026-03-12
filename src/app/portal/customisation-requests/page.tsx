import Link from 'next/link';
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
          <p>Allowance this month: {String(allowance)}. Used: {usedThisMonth}. Remaining: {remaining}.</p>
          <SimpleRequestForm
            action="/api/member/customisation-requests"
            disabledText={allowance === 0 ? 'Customisation requests are not included in your membership tier. Upgrade to Standard or Premium.' : (isBlocked ? 'Monthly customisation allowance reached for this billing period.' : undefined)}
            fields={[
              { key: 'requestDescription', label: 'Request description' },
              { key: 'requestedOutcome', label: 'Requested outcome' },
              { key: 'priority', label: 'Priority', options: ['low', 'normal', 'high', 'urgent'] },
              { key: 'relatedResourceTitle', label: 'Related resource title (optional)' },
              { key: 'relatedResourceId', label: 'Related resource ID (optional)' },
            ]}
          />
          {allowance === 0 || isBlocked ? <Link href="/membership" className="underline">View membership upgrade options</Link> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Active and historical requests</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {requests.map((request) => <li key={request.id} className="border rounded p-2">{request.status} · {request.priority} — {request.requestDescription} {request.memberVisibleUpdate ? `(${request.memberVisibleUpdate})` : ''}</li>)}
            {requests.length === 0 ? <li className="text-muted-foreground">No requests yet. Submit your first customisation request to begin.</li> : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
