import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workflows = [
  { title: 'DocuShare Maintenance', href: '/admin/docushare/templates', details: 'Manage DocuShare templates, including title, slug, and content.' },
  { title: 'Resources Publishing', href: '/admin/resources/articles', details: 'Manage resource articles, categories, and publishing status.' },
  { title: 'Offers Maintenance', href: '/admin/offers', details: 'Manage partner offers, including metadata, and active state.' },
  { title: 'General Site Maintenance', href: '/admin/site', details: 'General site settings and maintenance tasks.' },
];

export default function AdminContentOperationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Content Operations</h2>
      <p className="text-sm text-muted-foreground">Use this area to manage content across the public website.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <Link key={workflow.href} href={workflow.href}>
            <Card className="h-full hover:bg-muted/40">
              <CardHeader><CardTitle className="text-lg">{workflow.title}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{workflow.details}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
