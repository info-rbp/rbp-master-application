import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <p className="text-sm text-muted-foreground">Operational settings are distributed to preserve existing modules. Use links below for platform control surfaces.</p>
      <ul className="list-disc pl-6 text-sm">
        <li><Link className="underline" href="/admin/membership/plans">Membership plan and Square mapping settings</Link></li>
        <li><Link className="underline" href="/admin/membership/access-control">Entitlement and access control settings</Link></li>
        <li><Link className="underline" href="/admin/promotions">Promotion settings</Link></li>
        <li><Link className="underline" href="/admin/content-operations">Content publishing and upload-to-page settings</Link></li>
      </ul>
    </div>
  );
}
