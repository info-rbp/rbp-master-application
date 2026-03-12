import { notFound } from 'next/navigation';
import { ContentDetailShell } from '@/components/public/content-detail-shell';
import { resolveDocushareSuiteBySlug } from '@/lib/content-routing';

export default async function DocushareSuiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await resolveDocushareSuiteBySlug(slug);
  if (!content) notFound();
  return <ContentDetailShell content={content} />;
}
