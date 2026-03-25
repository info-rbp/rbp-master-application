'use server';

import { z } from 'zod';
import { firestore } from '@/firebase/server';
import { getServerAuthContext } from '@/lib/server-auth';
import { inviteTeamMember, removeTeamMember } from '@/lib/team';

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member']),
});

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

export async function inviteMemberAction(formData: FormData) {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
        return { success: false, error: 'Not authenticated' };
    }

    const validatedFields = inviteSchema.safeParse({
        email: formData.get('email'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Invalid input',
        };
    }

    const { email, role } = validatedFields.data;

    try {
        await inviteTeamMember(companyId, email, role);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to invite member' };
    }
}

export async function removeMemberAction(memberId: string) {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        await removeTeamMember(companyId, memberId);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to remove member' };
    }
}
