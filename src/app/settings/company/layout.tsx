import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function SettingsCompanyLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/settings/company');
  return children;
}
