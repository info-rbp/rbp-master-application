'use server';

import { revalidatePath } from 'next/cache';
import { updateServiceRequestStatus } from '@/lib/admin-operations';

export async function updateServiceRequestStatusAction(collectionName: 'discovery_calls' | 'support_requests' | 'customisation_requests', id: string, status: string, note?: string) {
  await updateServiceRequestStatus(collectionName, id, status as never, note);
  revalidatePath('/admin/services');
  revalidatePath('/admin/services/discovery-calls');
  revalidatePath('/admin/services/strategic-checkups');
  revalidatePath('/admin/services/support-requests');
  revalidatePath('/admin/services/customisation-requests');
}
