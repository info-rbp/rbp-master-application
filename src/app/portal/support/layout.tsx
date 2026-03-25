import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalSupportLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/support');
  return children;
}
