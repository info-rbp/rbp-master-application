import { firestore } from '@/firebase/server';
import { TeamMember } from './team';

export interface Company {
    id: string;
    name: string;
    members: TeamMember[];
}

export async function getCompany(companyId: string): Promise<Company | null> {
    const companyDoc = await firestore.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
        return null;
    }

    const companyData = companyDoc.data();

    // Fetch full member details
    const memberPromises = companyData.members.map(async (memberId: string) => {
        const userDoc = await firestore.collection('users').doc(memberId).get();
        if (!userDoc.exists) return null;
        const userData = userDoc.data();
        return {
            id: userDoc.id,
            name: userData.name,
            email: userData.email,
            role: userData.roles[companyId] || 'member',
        } as TeamMember;
    });

    const members = (await Promise.all(memberPromises)).filter(Boolean) as TeamMember[];

    return {
        id: companyDoc.id,
        name: companyData.name,
        members: members,
    };
}
