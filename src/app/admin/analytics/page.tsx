import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSummaryMetrics, getResourceUsageMetrics, computeConversionRate } from '@/lib/reporting';
import { firestore } from '@/firebase/server';

export default async function AdminAnalyticsPage() {
  const [summary, usage, checkoutStart, checkoutComplete] = await Promise.all([
    getAdminSummaryMetrics(),
    getResourceUsageMetrics(),
    firestore.collection('analytics_events').where('eventType', '==', 'checkout_started').get(),
    firestore.collection('analytics_events').where('eventType', '==', 'checkout_completed').get(),
  ]);

  const conversionRate = computeConversionRate(checkoutStart.size, checkoutComplete.size);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).map(([label, value]) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm capitalize">{label.replace(/([A-Z])/g, ' $1')}</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader><CardTitle className="text-sm">Checkout conversion rate</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{conversionRate}%</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Most viewed resources</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {usage.viewsByResource.slice(0, 8).map((item) => (
              <div key={item.resourceId} className="flex justify-between"><span>{item.resourceId}</span><span>{item.count}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most downloaded resources</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {usage.downloadsByResource.slice(0, 8).map((item) => (
              <div key={item.resourceId} className="flex justify-between"><span>{item.resourceId}</span><span>{item.count}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
