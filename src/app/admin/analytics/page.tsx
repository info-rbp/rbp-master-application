import AnalyticsDashboardClient from './analytics-dashboard-client';
import { getAdminAnalyticsEvents } from '@/lib/admin/analytics';

export default async function AnalyticsDashboardPage() {
  const events = await getAdminAnalyticsEvents();

  return <AnalyticsDashboardClient events={events} />;
}
