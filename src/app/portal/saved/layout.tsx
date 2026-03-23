import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalSavedLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/saved');
  return children;
}
