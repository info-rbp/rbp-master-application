import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { WorkflowError } from '@/lib/workflows/utils/errors';

export async function requireWorkflowAccess(context: BffRequestContext, actionKey: string) {
  try {
    await requireActionPolicyAccess(actionKey, context);
  } catch (error) {
    throw new WorkflowError({ code: 'workflow_permission_denied', message: error instanceof Error ? error.message : 'Forbidden.', status: 403, category: 'permission_denied' });
  }
}
