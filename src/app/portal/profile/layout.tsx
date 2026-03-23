import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalProfileLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/profile');
  return children;
}
