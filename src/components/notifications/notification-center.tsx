'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
};

export function NotificationCenter({ userId, role }: { userId: string; role: 'member' | 'admin' }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const response = await fetch(`/api/notifications?userId=${userId}&role=${role}`);
    const data = await response.json();
    setItems(data.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId, role]);

  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'single', notificationId: id }),
    });
    await load();
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'all', userId }),
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
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {!loading &&
          items.map((item) => (
            <div
              key={item.id}
              className={cn('rounded-md border p-3', !item.readAt && 'bg-muted/30')}
            >
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
                {!item.readAt && (
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
