import { notFound } from 'next/navigation';
import { resolveKnowledgeBySlugWithAccessControl } from '@/lib/content-routing';
import { ContentDetailShell } from '@/components/content/content-detail-shell';
import { getMemberAuth } from '@/lib/member-auth';

interface ContentPageProps {
  params: {
    slug: string;
  };
}

export default async function ContentPage({ params: { slug } }: ContentPageProps) {
  const auth = await getMemberAuth();
  const content = await resolveKnowledgeBySlugWithAccessControl(slug, 'knowledge_base', auth?.userId);

  if (!content) {
    notFound();
  }

  return <ContentDetailShell content={content} userId={auth?.userId} />;
}
