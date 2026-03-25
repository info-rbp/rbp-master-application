import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalDiscoveryCallsLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/discovery-calls');
  return children;
}
