import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const modules = [
  { title: 'Admin Users', href: '/admin/users', description: 'View admins and members with account and subscription context.' },
  { title: 'Roles & Permissions', href: '/admin/system/roles-and-permissions', description: 'Visibility into admin role model and publish permissions.' },
  { title: 'Settings', href: '/admin/system/settings', description: 'Platform-level operational settings and links to existing modules.' },
  { title: 'Notifications', href: '/admin/notifications', description: 'Operational notifications and member announcements.' },
  { title: 'Analytics', href: '/admin/analytics', description: 'Operational metrics and platform analytics.' },
  { title: 'Audit Logs', href: '/admin/audit-logs', description: 'Administrative audit history and key operational events.' },
  { title: 'Email / Automation Logs', href: '/admin/system/email-automation-logs', description: 'Outbound email and automation processing logs.' },
  { title: 'Launch readiness', href: '/admin/system/launch-readiness', description: 'Content completeness, env validation, and go-live preflight status.' },
];

export default function AdminSystemPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">System Operations</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full hover:bg-muted/40"><CardHeader><CardTitle className="text-lg">{module.title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{module.description}</CardContent></Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
