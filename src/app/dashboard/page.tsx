import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function DashboardPage() {
  const response = await requireSessionForPath('/dashboard');
  if (!response.authenticated) return null;

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bootstrapped from the platform session for {response.session.user.displayName} in {response.session.activeTenant.name}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {response.session.navigation.map((item) => (
          <div key={item.id} className="rounded-lg border p-4">
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.route}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
