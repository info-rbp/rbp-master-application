import { firestore } from '@/firebase/server';
import { requireAdminServerContext } from '@/lib/server-auth';

export default async function AdminRolesPermissionsPage() {
  await requireAdminServerContext();
  const snapshot = await firestore.collection('roles_admin').limit(200).get();
  const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
      <p className="text-sm text-muted-foreground">Roles remain server-verified via <code>roles_admin</code>. Client-side role editing is intentionally not exposed.</p>
      <div className="space-y-2">
        {admins.length === 0 ? <p className="text-sm text-muted-foreground">No admin role records found.</p> : admins.map((admin) => (
          <div className="rounded border p-3 text-sm" key={admin.id}>
            <p className="font-medium">{admin.id}</p>
            <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(admin, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
