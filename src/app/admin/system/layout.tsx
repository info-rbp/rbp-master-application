import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function AdminSystemLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/admin/system');
  return children;
}
