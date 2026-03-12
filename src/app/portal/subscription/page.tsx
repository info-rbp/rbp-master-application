import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireMemberAuth } from '../_lib/member-auth';
import { getMemberOverview } from '@/lib/member-dashboard';
import { safeLogAnalyticsEvent } from '@/lib/analytics-server';

export default async function SubscriptionPage() {
  const auth = await requireMemberAuth();
  const overview = await getMemberOverview(auth.userId);
  await safeLogAnalyticsEvent({ eventType: 'member_billing_history_viewed', userId: auth.userId, userRole: 'member' });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Subscription details</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Plan code:</strong> {overview.planCode}</p>
          <p><strong>Tier:</strong> {overview.tier}</p>
          <p><strong>Billing cycle:</strong> {overview.billingCycle}</p>
          <p><strong>Next renewal:</strong> {overview.renewalDate ?? 'Not scheduled'}</p>
          <p><strong>End date:</strong> {overview.endDate ?? 'N/A'}</p>
          <p><strong>Last payment status:</strong> {overview.lastPaymentStatus ?? 'N/A'}</p>
          <p className="text-muted-foreground">Payment methods are managed through the linked Square subscription flow.</p>
          <Link href="/membership/subscribe" className="underline">Upgrade, downgrade, or manage subscription</Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Billing history</CardTitle></CardHeader>
        <CardContent>
          {overview.billingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billing events available yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {overview.billingHistory.map((item) => (
                <li key={item.id} className="border rounded p-2">{String((item as { eventType?: string }).eventType ?? 'event')} — {item.createdAt}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
