'use server';

import { auth } from '@/firebase/server';
import { db } from '@/firebase/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function getProfile() {
  const user = await auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data();
}

export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const user = await auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const userRef = doc(db, 'users', user.uid);

  await updateDoc(userRef, {
    name,
    email,
  });

  return { success: true };
}
