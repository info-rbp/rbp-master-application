import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveServiceBySlug } from '@/lib/content-routing';

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveServiceBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
