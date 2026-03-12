import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const links = [
  { title: 'Discovery Calls', href: '/admin/services/discovery-calls', description: 'Manage discovery call queue and scheduling status.' },
  { title: 'Strategic Check-Ups', href: '/admin/services/strategic-checkups', description: 'Manage premium strategic check-up requests and assignments.' },
  { title: 'Support Requests', href: '/admin/services/support-requests', description: 'Manage support queue, ownership, and completion status.' },
  { title: 'Customisation Requests', href: '/admin/services/customisation-requests', description: 'Manage implementation/customisation requests and progress.' },
];

export default function AdminServicesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Services Operations</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:bg-muted/40">
              <CardHeader><CardTitle className="text-lg">{link.title}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{link.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
