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
  Gift,
  BookOpen,
  Newspaper,
  GraduationCap,
  Wrench,
  Database,
  LayoutList,
  ClipboardList,
  Star,
  Users,
  ChevronRight,
  Briefcase,
  Workflow,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';

const CollapsibleSidebarItem = ({
  icon,
  title,
  pathPrefix,
  children,
}: {
  icon: React.ElementType;
  title: string;
  pathPrefix: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const Icon = icon;
  const [isOpen, setIsOpen] = React.useState(pathname.startsWith(pathPrefix));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          variant="ghost"
          className="w-full justify-between"
          isActive={pathname.startsWith(pathPrefix) && !isOpen}
        >
          <div className="flex items-center gap-2">
            <Icon />
            <span>{title}</span>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transform transition-transform', isOpen && 'rotate-180')}
          />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="ml-7 mt-1 border-l border-border pl-2 py-1 space-y-1">
            {children}
        </SidebarMenu>
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
            <CollapsibleSidebarItem icon={Folder} title="DocuShare" pathPrefix="/admin/docushare">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/docushare/templates')} tooltip="Templates" variant="ghost">
                        <Link href="/admin/docushare/templates"><FileText /><span>Templates</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/docushare/companion-guides')} tooltip="Companion Guides" variant="ghost">
                        <Link href="/admin/docushare/companion-guides"><BookOpen /><span>Companion Guides</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/docushare/documentation-suites')} tooltip="Documentation Suites" variant="ghost">
                        <Link href="/admin/docushare/documentation-suites"><Folder /><span>Documentation Suites</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/docushare/end-to-end-processes')} tooltip="End-to-End Processes" variant="ghost">
                        <Link href="/admin/docushare/end-to-end-processes"><Workflow /><span>End-to-End Processes</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/docushare/customisation-service')} tooltip="Customisation Service" variant="ghost">
                        <Link href="/admin/docushare/customisation-service"><Wrench /><span>Customisation Service</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </CollapsibleSidebarItem>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/admin/partner-offers')}
              tooltip="Partner Offers"
            >
              <Link href="/admin/partner-offers">
                <Gift />
                <span>Partner Offers</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <CollapsibleSidebarItem icon={BookOpen} title="Knowledge Center" pathPrefix="/admin/knowledge-center">
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/knowledge-center/articles')} tooltip="Articles" variant="ghost">
                        <Link href="/admin/knowledge-center/articles"><Newspaper /><span>Articles</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/knowledge-center/guides')} tooltip="Guides" variant="ghost">
                        <Link href="/admin/knowledge-center/guides"><GraduationCap /><span>Guides</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/knowledge-center/tools')} tooltip="Tools" variant="ghost">
                        <Link href="/admin/knowledge-center/tools"><Wrench /><span>Tools</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/knowledge-center/knowledge-base')} tooltip="Knowledge Base" variant="ghost">
                        <Link href="/admin/knowledge-center/knowledge-base"><Database /><span>Knowledge Base</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </CollapsibleSidebarItem>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <CollapsibleSidebarItem icon={LayoutList} title="Site Content" pathPrefix="/admin/site-content">
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/site-content/past-projects')} tooltip="Past Projects" variant="ghost">
                        <Link href="/admin/site-content/past-projects"><Briefcase /><span>Past Projects</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/site-content/testimonials')} tooltip="Testimonials" variant="ghost">
                        <Link href="/admin/site-content/testimonials"><Star /><span>Testimonials</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </CollapsibleSidebarItem>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/admin/users')}
              tooltip="Users & Roles"
            >
              <Link href="/admin/users">
                <Users />
                <span>Users & Roles</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <CollapsibleSidebarItem icon={Star} title="Membership" pathPrefix="/admin/membership">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership/member-administration')} tooltip="Member Administration" variant="ghost">
                        <Link href="/admin/membership/member-administration"><Users /><span>Member Administration</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership/access-control')} tooltip="Access Control" variant="ghost">
                        <Link href="/admin/membership/access-control"><ClipboardList /><span>Access Control</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership/subscription-and-billing-oversight')} tooltip="Subscription & Billing" variant="ghost">
                        <Link href="/admin/membership/subscription-and-billing-oversight"><Gift /><span>Subscription & Billing</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership/content-gating-and-release-logic')} tooltip="Content Gating" variant="ghost">
                        <Link href="/admin/membership/content-gating-and-release-logic"><Workflow /><span>Content Gating</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership/reporting-and-operational-visibility')} tooltip="Reporting" variant="ghost">
                        <Link href="/admin/membership/reporting-and-operational-visibility"><LayoutList /><span>Reporting</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </CollapsibleSidebarItem>
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
