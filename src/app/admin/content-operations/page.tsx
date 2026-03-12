import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workflows = [
  { title: 'DocShare Upload & Page Controls', href: '/admin/docushare/templates', details: 'Manage title, slug, summary, content type, access tier, status, and related resources.' },
  { title: 'Knowledge Center Publishing', href: '/admin/knowledge-center/articles', details: 'Control category, tags, published state, metadata, and related resource linking.' },
  { title: 'Partner Marketplace Offers', href: '/admin/partner-offers', details: 'Manage offer metadata, claim instructions, active state, and page slug output.' },
  { title: 'Access & Publishing Alignment', href: '/admin/membership/access-control', details: 'Validate entitlement-tier mapping against access and publishing behavior.' },
];

export default function AdminContentOperationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Content Operations</h2>
      <p className="text-sm text-muted-foreground">Use this area to coordinate upload-to-page behavior, publishing state, access tiers, and related content linking across all content families.</p>
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
