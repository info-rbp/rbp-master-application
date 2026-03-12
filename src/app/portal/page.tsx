import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireMemberAuth } from './_lib/member-auth';
import { countMemberRequestsThisMonth, getMemberOverview, listDiscoveryCalls, listRecentActivity, listSavedItems, listSupportRequests } from '@/lib/member-dashboard';
import { safeLogAnalyticsEvent } from '@/lib/analytics';

export default async function PortalOverviewPage() {
  const auth = await requireMemberAuth();
  const [overview, support, calls, saved, recent, customisationCount] = await Promise.all([
    getMemberOverview(auth.userId),
    listSupportRequests(auth.userId),
    listDiscoveryCalls(auth.userId),
    listSavedItems(auth.userId),
    listRecentActivity(auth.userId),
    countMemberRequestsThisMonth(auth.userId),
  ]);

  await safeLogAnalyticsEvent({ eventType: 'member_dashboard_viewed', userId: auth.userId, userRole: 'member' });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Account overview</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <p><strong>Name:</strong> {overview.user?.name ?? auth.email}</p>
          <p><strong>Membership tier:</strong> {overview.tier}</p>
          <p><strong>Status:</strong> {overview.membershipStatus}</p>
          <p><strong>Plan:</strong> {overview.planCode} ({overview.billingCycle})</p>
          <p><strong>Billing state:</strong> {overview.lastPaymentStatus ?? 'No payment activity yet'}</p>
          <p><strong>Renewal / expiry:</strong> {overview.renewalDate ?? overview.endDate ?? 'Not scheduled'}</p>
          <p><strong>Service discount:</strong> {overview.serviceDiscountPercent}%</p>
          <p><strong>Promotion grant:</strong> {overview.activeGrant ? `${overview.activeGrant.sourceType} until ${overview.activeGrant.grantEndAt}` : 'None'}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Customisation this month</CardTitle></CardHeader><CardContent>{customisationCount}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Open support requests</CardTitle></CardHeader><CardContent>{support.filter((item) => item.status !== 'completed').length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Upcoming calls</CardTitle></CardHeader><CardContent>{calls.filter((item) => item.status !== 'completed').length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Saved items</CardTitle></CardHeader><CardContent>{saved.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Recent activity entries</CardTitle></CardHeader><CardContent>{recent.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm underline">
          <Link href="/portal/membership">Review membership benefits</Link>
          <Link href="/portal/subscription">View subscription and billing</Link>
          <Link href="/portal/customisation-requests">Submit a customisation request</Link>
          <Link href="/portal/support">Open support request</Link>
          <Link href="/portal/discovery-calls">Book a call</Link>
          <Link href="/portal/saved">Open saved resources</Link>
        </CardContent>
      </Card>
    </div>
  );
}
