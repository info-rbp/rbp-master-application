import { requireModule, requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { WorkflowError } from '@/lib/workflows/utils/errors';

export function requireWorkflowAccess(context: BffRequestContext, input: { moduleKey: 'applications' | 'customers' | 'loans' | 'support' | 'finance' | 'documents'; resource: string; action: string }) {
  try {
    requireModule(context, input.moduleKey);
    requirePermission(context, input.resource, input.action);
  } catch (error) {
    throw new WorkflowError({ code: 'workflow_permission_denied', message: error instanceof Error ? error.message : 'Forbidden.', status: 403, category: 'permission_denied' });
  }
}
