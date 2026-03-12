import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSummaryMetrics } from '@/lib/reporting';
import { ADMIN_NAV_SECTIONS } from './components/admin-navigation';

export default async function AdminDashboard() {
  const metrics = await getAdminSummaryMetrics();

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
          {ADMIN_NAV_SECTIONS.map((section) => {
            const href = section.href ?? section.items[0]?.href;
            return href ? (
              <Link key={section.title} href={href} className="rounded border p-3 text-sm hover:bg-muted/40">
                <p className="font-medium">{section.title}</p>
                <p className="text-muted-foreground">{section.items.length} operational module(s)</p>
              </Link>
            ) : null;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
