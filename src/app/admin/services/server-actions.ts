'use server';

import { revalidatePath } from 'next/cache';
import { updateServiceRequestStatus } from '@/lib/admin-operations';
import type { ServiceWorkflowType, WorkflowPriority, WorkflowStatus } from '@/lib/service-workflows';

export async function updateServiceRequestStatusAction(input: {
  workflowType: ServiceWorkflowType;
  id: string;
  status: WorkflowStatus;
  priority?: WorkflowPriority;
  memberVisibleUpdate?: string;
  internalNotes?: string;
}) {
  await updateServiceRequestStatus(input);
  revalidatePath('/admin/services');
  revalidatePath('/admin/services/discovery-calls');
  revalidatePath('/admin/services/strategic-checkups');
  revalidatePath('/admin/services/support-requests');
  revalidatePath('/admin/services/customisation-requests');
}
