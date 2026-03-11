import { UsersAdminManager } from '@/app/admin/components/admin-content-managers';
import { getUsersForAdmin } from '@/lib/data';

export default async function AdminUsersPage() {
  const users = await getUsersForAdmin();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Users & Roles</h2>
      <UsersAdminManager initial={users} />
    </div>
  );
}
