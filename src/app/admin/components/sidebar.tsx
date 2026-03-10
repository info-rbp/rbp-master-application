'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Folder,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-lg font-semibold">DocShare</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/admin'}
              tooltip="Dashboard"
            >
              <Link href="/admin">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/admin/suites')}
              tooltip="Suites"
            >
              <Link href="/admin/suites">
                <Folder />
                <span>Suites</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/admin/documents')}
              tooltip="Documents"
            >
              <Link href="/admin/documents">
                <FileText />
                <span>Documents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="justify-between w-full h-14">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">
                    admin@docshare.com
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@docshare.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
