import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveServiceBySlug } from '@/lib/content-routing';

export default async function ServicePage() {
  const content = await resolveServiceBySlug('sales-marketing');
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
