import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function AdminUsersLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/admin/users');
  return children;
}
