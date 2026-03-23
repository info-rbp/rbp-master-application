import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function SettingsSecurityLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/settings/security');
  return children;
}
