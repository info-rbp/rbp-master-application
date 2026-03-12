import { PastProjectsManager } from '@/app/admin/components/admin-content-managers';
import { getPastProjects } from '@/lib/data';

export default async function AdminPastProjectsPage() {
  const projects = await getPastProjects();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Past Projects</h2>
      <PastProjectsManager initial={projects} />
    </div>
  );
}
