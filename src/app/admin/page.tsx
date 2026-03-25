import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSummaryMetrics } from '@/lib/reporting';
import { resolveSessionResponse } from '@/lib/platform/session';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { buildAdminNavigation } from '@/lib/platform/navigation-builder';

export default async function AdminDashboard() {
  const metrics = await getAdminSummaryMetrics();
  const sessionResponse = await resolveSessionResponse();
  const context = createNavigationContextFromSession(sessionResponse.authenticated ? sessionResponse.session : null, '/admin');
  const navigation = buildAdminNavigation(context);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(metrics).map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">{label.replace(/([A-Z])/g, ' $1')}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Platform Operations Domains</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {navigation.map((item) => (
            <Link key={item.id} href={item.route} className="rounded border p-3 text-sm hover:bg-muted/40">
              <p className="font-medium">{item.label}</p>
              <p className="text-muted-foreground">{Math.max(item.children.length, 1)} route(s)</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
