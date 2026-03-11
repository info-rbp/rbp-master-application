'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Banner = {
  id: string;
  title: string;
  message: string;
  dismissible: boolean;
};

export function AnnouncementBanner({ announcements }: { announcements: Banner[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = useMemo(
    () =>
      announcements.filter((item) => {
        if (!item.dismissible) return true;
        if (dismissed.includes(item.id)) return false;
        if (typeof window !== 'undefined') {
          return localStorage.getItem(`announcement-dismissed-${item.id}`) !== '1';
        }
        return true;
      }),
    [announcements, dismissed],
  );

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((item) => (
        <div key={item.id} className="rounded-md border bg-secondary/30 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.message}</p>
            </div>
            {item.dismissible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  localStorage.setItem(`announcement-dismissed-${item.id}`, '1');
                  setDismissed((prev) => [...prev, item.id]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
