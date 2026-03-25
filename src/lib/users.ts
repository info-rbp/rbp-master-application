
import { firestore } from '@/firebase/server';
import { User } from './team';

export async function getUserByEmail(email: string): Promise<User | null> {
    const snapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
}

export async function getUserById(id: string): Promise<User | null> {
    const doc = await firestore.collection('users').doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return { id: doc.id, ...doc.data() } as User;
}
