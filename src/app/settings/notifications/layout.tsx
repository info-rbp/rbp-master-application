import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function SettingsNotificationsLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/settings/notifications');
  return children;
}
