import { KnowledgeManager } from '@/app/admin/components/admin-content-managers';
import { getKnowledgeArticles } from '@/lib/data';

export default async function AdminKnowledgeBasePage() {
  const entries = await getKnowledgeArticles();
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2><KnowledgeManager initial={entries} type="knowledge_base" /></div>;
}
