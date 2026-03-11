import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSummaryMetrics } from '@/lib/reporting';

export default async function AdminDashboard() {
  const metrics = await getAdminSummaryMetrics();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
    </div>
  );
}
