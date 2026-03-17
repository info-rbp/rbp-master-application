
import { firestore } from '@/firebase/server';

export interface User {
    id: string;
    name: string;
    email: string;
    roles: {
        [key: string]: 'owner' | 'admin' | 'member';
    };
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
}

export interface TeamInvitation {
    id: string;
    companyId: string;
    email: string;
    role: 'admin' | 'member';
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    expiresAt: string;
}

export async function inviteTeamMember(companyId: string, email: string, role: 'admin' | 'member'): Promise<TeamInvitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Invitations are valid for 7 days

    const invitation = {
        companyId,
        email,
        role,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
    };

    const docRef = await firestore.collection('teamInvitations').add(invitation);

    return { id: docRef.id, ...invitation };
}

export async function acceptTeamInvitation(invitationId: string, user: User): Promise<void> {
    const invitationRef = firestore.collection('teamInvitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
        throw new Error('Invitation not found.');
    }

    const invitation = invitationDoc.data() as TeamInvitation;

    if (invitation.status !== 'pending') {
        throw new Error('This invitation has already been actioned.');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
        throw new Error('This invitation has expired.');
    }

    // Add the user to the company
    const companyRef = firestore.collection('companies').doc(invitation.companyId);
    await companyRef.update({
        members: firestore.FieldValue.arrayUnion(user.id),
    });

    // Update the user's role
    const userRef = firestore.collection('users').doc(user.id);
    await userRef.update({
        [`roles.${invitation.companyId}`]: invitation.role,
    });

    // Update the invitation status
    await invitationRef.update({ status: 'accepted' });
}

export async function removeTeamMember(companyId: string, memberId: string): Promise<void> {
    // Prevent removing the company owner
    const companyRef = firestore.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    const companyData = companyDoc.data();

    if (companyData.ownerId === memberId) {
        throw new Error('Cannot remove the company owner.');
    }

    // Remove the user from the company's members list
    await companyRef.update({
        members: firestore.FieldValue.arrayRemove(memberId),
    });

    // Remove the company role from the user
    const userRef = firestore.collection('users').doc(memberId);
    await userRef.update({
        [`roles.${companyId}`]: firestore.FieldValue.delete(),
    });
}

export async function getPendingInvitationByEmail(email: string): Promise<TeamInvitation | null> {
    const snapshot = await firestore.collection('teamInvitations')
        .where('email', '==', email)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TeamInvitation;
}

