import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireMemberAuth } from '../_lib/member-auth';
import { getMemberOverview } from '@/lib/member-dashboard';
import { ENTITLEMENT_MATRIX } from '@/lib/entitlements';
import { safeLogAnalyticsEvent } from '@/lib/analytics';

export default async function MembershipPage() {
  const auth = await requireMemberAuth();
  const overview = await getMemberOverview(auth.userId);
  const benefits = ENTITLEMENT_MATRIX[overview.tier];
  await safeLogAnalyticsEvent({ eventType: 'member_membership_viewed', userId: auth.userId, userRole: 'member' });

  return (
    <Card>
      <CardHeader><CardTitle>Membership</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>Current tier: <strong>{overview.tier}</strong> ({overview.planCode})</p>
        <p>Status: <strong>{overview.membershipStatus}</strong></p>
        <p>Customisation allowance: <strong>{String(benefits.customisation_requests_limit_per_month)}</strong></p>
        <p>Service discount: <strong>{benefits.service_discount_percent}%</strong></p>
        <p>Implementation support included: <strong>{benefits.implementation_support ? 'Yes' : 'No'}</strong></p>
        <p>Discovery call included: <strong>{benefits.discovery_calls ? 'Yes' : 'No'}</strong></p>
        <p>Strategic check-up included: <strong>{benefits.strategic_checkups ? 'Yes' : 'No'}</strong></p>
        <div className="pt-2">
          <Link href="/membership" className="underline">Compare plans and upgrade</Link>
        </div>
      </CardContent>
    </Card>
  );
}
