'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/provider';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  read: boolean;
  createdAt: string;
};

export function NotificationCenter() {
  const { user } = useUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const token = await user.getIdToken();
    const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? 'Failed to load notifications');
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user?.uid]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const markRead = async (id: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode: 'single', notificationId: id }),
    });
    await load();
  };

  const markAllRead = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode: 'all' }),
    });
    await load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          <Badge variant="secondary">{unreadCount}</Badge>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0 || !user}>
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}
        {!loading && error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
        {!loading &&
          !error &&
          items.map((item) => (
            <div key={item.id} className={cn('rounded-md border p-3', !item.read && 'bg-muted/30')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  {item.actionUrl && (
                    <a className="text-sm text-primary underline" href={item.actionUrl}>
                      Open
                    </a>
                  )}
                </div>
                {!item.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
