import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function PortalMembershipLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/portal/membership');
  return children;
}
