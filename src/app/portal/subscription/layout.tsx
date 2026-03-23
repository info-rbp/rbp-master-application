import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalSubscriptionLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/subscription');
  return children;
}
