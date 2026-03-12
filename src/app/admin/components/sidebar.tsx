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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';
import { ADMIN_NAV_SECTIONS, ADMIN_TOP_LEVEL_LINKS, type AdminNavItem } from './admin-navigation';

const isItemActive = (pathname: string, item: AdminNavItem) => {
  if (pathname === item.href) return true;
  return (item.matchPrefixes ?? []).some((prefix) => pathname.startsWith(prefix));
};

const CollapsibleSidebarItem = ({
  title,
  pathPrefix,
  icon,
  children,
}: {
  title: string;
  pathPrefix: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const Icon = icon;
  const [isOpen, setIsOpen] = React.useState(pathname.startsWith(pathPrefix));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          variant="outline"
          className="w-full justify-between"
          isActive={pathname.startsWith(pathPrefix)}
        >
          <div className="flex items-center gap-2">
            <Icon />
            <span>{title}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transform transition-transform', isOpen && 'rotate-180')} />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-7 mt-1 border-l border-border py-1 pl-2 space-y-1">{children}</SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
};

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
          <span className="text-lg font-semibold">RBP</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {ADMIN_TOP_LEVEL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isItemActive(pathname, item)} tooltip={item.title}>
                  <Link href={item.href}>
                    {Icon ? <Icon /> : null}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {ADMIN_NAV_SECTIONS.map((section) => (
            <SidebarMenuItem key={section.title}>
              <CollapsibleSidebarItem
                icon={section.icon}
                title={section.title}
                pathPrefix={section.pathPrefix ?? section.items[0]?.href ?? '/admin'}
              >
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isItemActive(pathname, item)} tooltip={item.title} variant="outline">
                        <Link href={item.href}>
                          {ItemIcon ? <ItemIcon /> : null}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </CollapsibleSidebarItem>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between w-full h-14">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@docshare.com</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">admin@docshare.com</p>
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
