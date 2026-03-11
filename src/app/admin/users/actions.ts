'use server';

import { revalidatePath } from 'next/cache';
import { updateUserAccountStatus, updateUserAdminFields, updateUserRole } from '@/lib/data';

export async function saveUserProfileFields(uid: string, payload: { name: string; phone?: string; company?: string }) {
  const user = await updateUserAdminFields(uid, payload);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}

export async function saveUserRole(uid: string, role: string) {
  const user = await updateUserRole(uid, role);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}

export async function saveUserAccountStatus(uid: string, status: 'active' | 'suspended') {
  const user = await updateUserAccountStatus(uid, status);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}
