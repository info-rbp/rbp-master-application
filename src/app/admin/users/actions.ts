'use server';

import { revalidatePath } from 'next/cache';
import { updateUserAccountStatus, updateUserAdminFields, updateUserRole } from '@/lib/data';
import { requireAdminServerContext } from '@/lib/server-auth';

export async function saveUserProfileFields(uid: string, payload: { name: string; phone?: string; company?: string }) {
  const auth = await requireAdminServerContext();
  const user = await updateUserAdminFields(uid, payload, auth.userId);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}

export async function saveUserRole(uid: string, role: string) {
  const auth = await requireAdminServerContext();
  const user = await updateUserRole(uid, role, auth.userId);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}

export async function saveUserAccountStatus(uid: string, status: 'active' | 'suspended') {
  const auth = await requireAdminServerContext();
  const user = await updateUserAccountStatus(uid, status, auth.userId);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${uid}`);
  return user;
}
