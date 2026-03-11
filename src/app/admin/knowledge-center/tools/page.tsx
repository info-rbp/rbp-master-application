import KnowledgeContentManager from '../components/knowledge-content-manager';

export default function AdminToolsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tools & Templates</h2>
      </div>
      <KnowledgeContentManager title="Tools" type="tool" />
    </div>
  );
}
