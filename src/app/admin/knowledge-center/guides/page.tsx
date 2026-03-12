import { KnowledgeManager } from '@/app/admin/components/admin-content-managers';
import { getKnowledgeArticles } from '@/lib/data';

export default async function AdminKnowledgeGuidesPage() {
  const entries = await getKnowledgeArticles();
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><h2 className="text-3xl font-bold tracking-tight">Guides</h2><KnowledgeManager initial={entries} type="guide" /></div>;
}
