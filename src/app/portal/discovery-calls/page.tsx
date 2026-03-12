import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canBookStrategicCheckup } from '@/lib/entitlements';
import { getMemberOverview, listDiscoveryCalls } from '@/lib/member-dashboard';
import { requireMemberAuth } from '../_lib/member-auth';
import { SimpleRequestForm } from '../components/member-forms';

export default async function DiscoveryCallsPage() {
  const auth = await requireMemberAuth();
  const [overview, calls] = await Promise.all([getMemberOverview(auth.userId), listDiscoveryCalls(auth.userId)]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Request a call</CardTitle></CardHeader>
        <CardContent>
          <SimpleRequestForm
            action="/api/member/discovery-calls"
            fields={[
              { key: 'callType', label: 'Call type', options: canBookStrategicCheckup(overview.tier) ? ['discovery_call', 'strategic_checkup'] : ['discovery_call'] },
              { key: 'preferredDateTime', label: 'Preferred date/time', type: 'datetime-local' },
              { key: 'requestedWindow', label: 'Requested window (optional)' },
              { key: 'notes', label: 'Notes' },
            ]}
          />
          <p className="text-xs text-muted-foreground mt-2">Strategic check-ups: {canBookStrategicCheckup(overview.tier) ? 'available' : 'Premium-only'}.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Past and active call requests</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {calls.map((call) => <li key={call.id} className="border rounded p-2">{call.workflowType} · {call.status} {call.memberVisibleUpdate ? `— ${call.memberVisibleUpdate}` : ''}</li>)}
            {calls.length === 0 ? <li className="text-muted-foreground">No call requests yet.</li> : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
