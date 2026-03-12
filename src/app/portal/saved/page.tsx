import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listRecentActivity, listSavedItems } from '@/lib/member-dashboard';
import { requireMemberAuth } from '../_lib/member-auth';
import { SimpleRequestForm } from '../components/member-forms';

export default async function SavedPage() {
  const auth = await requireMemberAuth();
  const [savedItems, recent] = await Promise.all([listSavedItems(auth.userId), listRecentActivity(auth.userId)]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Save a resource</CardTitle></CardHeader>
        <CardContent>
          <SimpleRequestForm action="/api/member/saved-items" fields={[{ key: 'title', label: 'Title' }, { key: 'itemPath', label: 'Public URL path' }, { key: 'itemType', label: 'Type (docushare/knowledge/partner_offer/service/other)' }]} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Saved resources</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {savedItems.map((item) => (
              <li key={item.id} className="border rounded p-2">
                <Link href={item.itemPath} className="underline">{item.title}</Link> ({item.itemType})
              </li>
            ))}
            {savedItems.length === 0 ? <li className="text-muted-foreground">No saved items.</li> : null}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {recent.map((activity) => <li key={activity.id} className="border rounded p-2">{activity.activityType} · {activity.title}</li>)}
            {recent.length === 0 ? <li className="text-muted-foreground">No recent activity yet.</li> : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
