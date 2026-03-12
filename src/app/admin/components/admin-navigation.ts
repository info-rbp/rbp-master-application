import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Bell,
  BookOpen,
  Briefcase,
  FileText,
  Gift,
  LayoutDashboard,
  LineChart,
  Percent,
  Settings,
  ShieldCheck,
  UserCog,
  Star,
  Users,
  Wrench,
} from 'lucide-react';

export type AdminNavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  matchPrefixes?: string[];
};

export type AdminNavSection = {
  title: string;
  icon: LucideIcon;
  href?: string;
  pathPrefix?: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Membership',
    icon: Star,
    href: '/admin/membership',
    pathPrefix: '/admin/membership',
    items: [
      { title: 'Members', href: '/admin/membership/member-administration', icon: Users, matchPrefixes: ['/admin/membership/member-administration', '/admin/membership/members'] },
      { title: 'Membership Plans', href: '/admin/membership/plans', icon: BadgeDollarSign },
      { title: 'Billing', href: '/admin/membership/subscription-and-billing-oversight', icon: BadgeDollarSign },
      { title: 'Access Permissions', href: '/admin/membership/access-control', icon: ShieldCheck },
      { title: 'CRM / Notes / History', href: '/admin/membership/reporting-and-operational-visibility', icon: Briefcase },
    ],
  },
  {
    title: 'Content',
    icon: BookOpen,
    items: [
      { title: 'DocShare', href: '/admin/docushare/templates', icon: FileText, matchPrefixes: ['/admin/docushare'] },
      { title: 'Knowledge Center', href: '/admin/knowledge-center/articles', icon: BookOpen, matchPrefixes: ['/admin/knowledge-center'] },
      { title: 'Partner Marketplace', href: '/admin/partner-offers', icon: Gift },
      { title: 'Upload-to-Page Controls', href: '/admin/content-operations', icon: Wrench },
    ],
  },
  {
    title: 'Services',
    icon: Wrench,
    href: '/admin/services',
    pathPrefix: '/admin/services',
    items: [
      { title: 'Discovery Calls', href: '/admin/services/discovery-calls', icon: Briefcase },
      { title: 'Strategic Check-Ups', href: '/admin/services/strategic-checkups', icon: Briefcase },
      { title: 'Support Requests', href: '/admin/services/support-requests', icon: Wrench },
      { title: 'Customisation Requests', href: '/admin/services/customisation-requests', icon: Wrench },
    ],
  },
  {
    title: 'Promotions',
    icon: Percent,
    href: '/admin/promotions',
    pathPrefix: '/admin/promotions',
    items: [
      { title: 'Free Membership Offers', href: '/admin/promotions?type=free_membership', icon: Gift },
      { title: 'Discount Codes', href: '/admin/promotions?type=discount_code', icon: Percent },
      { title: 'Service Purchase Promotions', href: '/admin/promotions?type=service_purchase', icon: Briefcase },
      { title: 'Annual Plans', href: '/admin/promotions?type=annual_plan', icon: BadgeDollarSign },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    href: '/admin/system',
    pathPrefix: '/admin/system',
    items: [
      { title: 'Admin Users', href: '/admin/users', icon: UserCog },
      { title: 'Roles & Permissions', href: '/admin/system/roles-and-permissions', icon: ShieldCheck },
      { title: 'Settings', href: '/admin/system/settings', icon: Settings },
      { title: 'Notifications', href: '/admin/notifications', icon: Bell },
      { title: 'Analytics', href: '/admin/analytics', icon: LineChart },
      { title: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
      { title: 'Email / Automation Logs', href: '/admin/system/email-automation-logs', icon: FileText },
    ],
  },
];

export const ADMIN_TOP_LEVEL_LINKS: AdminNavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
];
