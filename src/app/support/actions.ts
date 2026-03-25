'use server';

import { auth, db } from '@/firebase/server';
import { collection, addDoc, getDocs, getDoc, query, where, doc } from 'firebase/firestore';

async function isPremiumUser(uid: string): Promise<boolean> {
    // For this implementation, we will mock the premium status check.
    // In a real-world scenario, you would check the user's subscription status against your billing provider (e.g., Stripe).
    return Math.random() > 0.5;
}

export async function createTicket(formData: FormData) {
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const isPremium = await isPremiumUser(user.uid);

    await addDoc(collection(db, 'tickets'), {
      uid: user.uid,
      subject,
      message,
      status: 'open',
      priority: isPremium ? 'high' : 'normal',
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTickets() {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const q = query(collection(db, 'tickets'), where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    }));

    return { success: true, tickets };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTicket(id: string) {
    try {
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated.');
        }

        const ticketRef = doc(db, 'tickets', id);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists() || ticketSnap.data().uid !== user.uid) {
            return { success: false, error: 'Ticket not found.' };
        }

        const ticket = {
            id: ticketSnap.id,
            ...ticketSnap.data(),
            createdAt: ticketSnap.data().createdAt.toDate(),
        };

        return { success: true, ticket };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
