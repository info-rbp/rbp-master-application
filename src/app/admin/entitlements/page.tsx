import { getAllUsers, getAllAccessGrants } from '@/lib/admin/entitlements';
import { AccessGrantForm } from '@/components/admin/access-grant-form';
import { AccessGrantsTable } from '@/components/admin/access-grants-table';

export default async function EntitlementsPage() {
    const [users, grants] = await Promise.all([getAllUsers(), getAllAccessGrants()]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Access Grants</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Grant New Access Tier</h2>
                    <AccessGrantForm users={users} />
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">Current Access Grants</h2>
                    <AccessGrantsTable users={users} grants={grants} />
                </div>
            </div>
        </div>
    );
}
