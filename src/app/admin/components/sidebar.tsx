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
import { LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';
import { usePlatformSession } from '@/app/providers/platform-session-provider';
import { TenantSwitcher } from '@/components/platform/tenant-switcher';
import { createNavigationContextFromSession } from '@/lib/platform/navigation-context';
import { buildAdminNavigation } from '@/lib/platform/navigation-builder';
import type { NavigationItem } from '@/lib/platform/types';

const isItemActive = (pathname: string, item: NavigationItem) => {
  if (pathname === item.route) return true;
  return item.children.some((child) => pathname.startsWith(child.route));
};

const CollapsibleSidebarItem = ({ item }: { item: NavigationItem }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(pathname.startsWith(item.route));

  if (item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isItemActive(pathname, item)} tooltip={item.label}>
          <Link href={item.route}><span>{item.label}</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton variant="outline" className="w-full justify-between" isActive={isItemActive(pathname, item)}>
          <div className="flex items-center gap-2">
            <span>{item.label}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transform transition-transform', isOpen && 'rotate-180')} />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-7 mt-1 border-l border-border py-1 pl-2 space-y-1">
          {item.children.map((child) => (
            <SidebarMenuItem key={child.id}>
              <SidebarMenuButton asChild isActive={pathname === child.route || pathname.startsWith(child.route)} tooltip={child.label} variant="outline">
                <Link href={child.route}><span>{child.label}</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { session, logout } = usePlatformSession();
  const context = React.useMemo(() => createNavigationContextFromSession(session, pathname), [session, pathname]);
  const navigation = React.useMemo(() => buildAdminNavigation(context), [context]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <div>
            <span className="text-lg font-semibold">RBP</span>
            <p className="text-xs text-muted-foreground">{session?.activeTenant.name ?? 'Loading tenant…'}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 pb-3">
          <TenantSwitcher />
        </div>
        <SidebarMenu>
          {navigation.map((item) => (
            <CollapsibleSidebarItem key={item.id} item={item} />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between w-full h-14">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user.avatarUrl} />
                  <AvatarFallback>{session?.user.displayName?.slice(0, 1) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{session?.user.displayName ?? 'Loading…'}</span>
                  <span className="text-xs text-muted-foreground">{session?.user.email ?? ''}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.activeTenant.name ?? 'Tenant'}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user.email ?? ''}</p>
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
