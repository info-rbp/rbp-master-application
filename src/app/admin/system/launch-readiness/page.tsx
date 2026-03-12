import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLaunchReadinessChecks } from '@/lib/launch-readiness';

export default async function LaunchReadinessPage() {
  const checks = await getLaunchReadinessChecks();
  const readyCount = checks.filter((check) => check.status === 'ready').length;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Launch readiness</h1>
      <p className="text-sm text-muted-foreground">Operational preflight for content completeness and required environment configuration.</p>
      <p className="text-sm text-muted-foreground">{readyCount}/{checks.length} checks ready.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <Card key={check.key}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <CardTitle className="text-base">{check.label}</CardTitle>
              <Badge variant={check.status === 'ready' ? 'default' : 'outline'}>{check.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{check.detail}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
