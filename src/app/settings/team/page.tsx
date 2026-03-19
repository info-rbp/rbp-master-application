import { firestore } from '@/firebase/server';
import { getCompany } from '@/lib/company';
import { getServerAuthContext } from '@/lib/server-auth';
import { TeamMembersTable } from '@/components/team/team-members-table';
import { InviteMemberForm } from '@/components/team/invite-member-form';

async function getCurrentCompanyId() {
    const auth = await getServerAuthContext();
    if (!auth) return null;

    const userDoc = await firestore.collection('users').doc(auth.userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data() as { companyId?: string; roles?: Record<string, string> } | undefined;
    if (userData?.companyId) return userData.companyId;

    const companyIds = Object.keys(userData?.roles ?? {});
    return companyIds[0] ?? null;
}

export default async function TeamManagementPage() {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
        return <div>Not logged in</div>;
    }

    const company = await getCompany(companyId);
    if (!company) {
        return <div>Company not found</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Team Management</h2>
                <p className="text-muted-foreground">Invite and manage your team members.</p>
            </div>
            <div className="space-y-4">
                <InviteMemberForm />
                <TeamMembersTable members={company.members} />
            </div>
        </div>
    );
}
