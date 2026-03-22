import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './components/sidebar';
import { requireSessionForPath } from '@/lib/platform/server-guards';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSessionForPath('/admin');

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebar />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
