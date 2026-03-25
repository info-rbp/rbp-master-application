
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const contentModules = [
  {
    title: 'Tools',
    description: 'Manage tool metadata, schemas, and availability.',
    href: '/admin/tools',
  },
  {
    title: 'Partners',
    description: 'Maintain partner metadata, offers, and active states.',
    href: '/admin/partners',
  },
  {
    title: 'Resources',
    description: 'Manage member/public resources, categories, and access tiers.',
    href: '/admin/resources',
  },
];

export default function ContentDashboard() {
  return (
    <div className="space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Modules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {contentModules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="rounded border p-3 text-sm hover:bg-muted/40"
            >
              <p className="font-medium">{module.title}</p>
              <p className="text-muted-foreground">{module.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
