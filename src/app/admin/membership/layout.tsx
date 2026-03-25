import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function AdminMembershipLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/admin/membership');
  return children;
}
