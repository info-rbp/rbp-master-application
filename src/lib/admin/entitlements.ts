import { firestore } from '@/firebase/server';
import { AccessGrant } from '@/lib/entitlements/access-grant';

export async function getAllUsers() {
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllAccessGrants(): Promise<Record<string, AccessGrant[]>> {
    const allGrants: Record<string, AccessGrant[]> = {};
    const users = await getAllUsers();

    for (const user of users) {
        const grantsRef = firestore.collection('users').doc(user.id).collection('accessGrants');
        const snapshot = await grantsRef.get();
        allGrants[user.id] = snapshot.docs.map(doc => doc.data() as AccessGrant);
    }

    return allGrants;
}
