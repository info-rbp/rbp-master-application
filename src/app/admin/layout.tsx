import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './components/sidebar';
import { requireAdminServerContext } from '@/lib/server-auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const isProtectedAdminPath = requestHeaders.get('x-rbp-admin-protected') === '1';

  if (isProtectedAdminPath) {
    try {
      await requireAdminServerContext();
    } catch {
      redirect('/admin/login');
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebar />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
