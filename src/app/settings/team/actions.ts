'use server';

import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { inviteTeamMember, removeTeamMember } from '@/lib/team';

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member']),
});

export async function inviteMemberAction(formData: FormData) {
    const user = await getUser();
    if (!user) {
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
        await inviteTeamMember(user.companyId, email, role);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function removeMemberAction(memberId: string) {
    const user = await getUser();
    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        await removeTeamMember(user.companyId, memberId);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
