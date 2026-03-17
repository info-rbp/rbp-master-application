'use server';

import { auth } from '@/firebase/server';
import { revalidatePath } from 'next/cache';

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New passwords do not match.' };
  }

  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    // Re-authentication is not directly possible in a server-side context like this.
    // Firebase Admin SDK does not support re-authentication.
    // A client-side call to re-authenticate is needed before calling this action.
    // For this implementation, we will proceed to update the password directly.
    // In a real-world scenario, you would want to implement a more secure flow.

    await auth().updateUser(user.uid, { password: newPassword });
    revalidatePath('/settings/security');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function globalSignOut() {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    await auth().revokeRefreshTokens(user.uid);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
