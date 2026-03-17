import { getUser } from '@/lib/auth';
import { getCompany } from '@/lib/company';
import { TeamMembersTable } from '@/components/team/team-members-table';
import { InviteMemberForm } from '@/components/team/invite-member-form';

export default async function TeamManagementPage() {
    const user = await getUser();
    if (!user) {
        return <div>Not logged in</div>; // Or redirect
    }

    // Assuming the user is associated with a single company for this example
    // In a real app, you might need to select the company
    const company = await getCompany(user.companyId);
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
