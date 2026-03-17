'use server';

import { auth } from '@/firebase/server';
import { db } from '@/firebase/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function getCompany() {
  const user = await auth().currentUser;
  if (!user || !user.companyId) {
    return null;
  }

  const companyRef = doc(db, 'companies', user.companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) {
    return null;
  }

  return companySnap.data();
}

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string;

  const user = await auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const companyRef = doc(db, 'companies');
  await setDoc(companyRef, { name, ownerId: user.uid });

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, { companyId: companyRef.id });

  return { success: true };
}

export async function updateCompany(formData: FormData) {
  const name = formData.get('name') as string;
  const website = formData.get('website') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zip = formData.get('zip') as string;

  const user = await auth().currentUser;
  if (!user || !user.companyId) {
    throw new Error('User not authenticated or does not have a companyId');
  }

  const companyRef = doc(db, 'companies', user.companyId);

  await updateDoc(companyRef, {
    name,
    website,
    address,
    city,
    state,
    zip,
  });

  return { success: true };
}
