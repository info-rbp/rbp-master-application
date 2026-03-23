import type { ReactNode } from 'react';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function AdminKnowledgeCenterLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/admin/knowledge-center');
  return children;
}
