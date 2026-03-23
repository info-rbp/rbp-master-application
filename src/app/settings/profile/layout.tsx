import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function SettingsProfileLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/settings/profile');
  return children;
}
