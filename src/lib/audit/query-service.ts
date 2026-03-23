import { AuditService } from '@/lib/audit/service';
import type { AuditQueryInput } from '@/lib/audit/types';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { WorkflowError } from '@/lib/workflows/utils/errors';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';

export class AuditQueryService {
  private readonly audit = new AuditService();

  async query(context: BffRequestContext, filters: Omit<AuditQueryInput, 'tenantId'>) {
    try {
      await requireActionPolicyAccess('admin.audit.view', context);
    } catch (error) {
      throw new WorkflowError({ code: 'audit_forbidden', message: 'You are not allowed to view the audit feed.', status: 403, category: 'permission_denied' });
    }
    return this.audit.query({ ...filters, tenantId: context.session.activeTenant.id });
  }

  async getById(context: BffRequestContext, id: string) {
    try {
      await requireActionPolicyAccess('admin.audit.view', context);
    } catch (error) {
      throw new WorkflowError({ code: 'audit_forbidden', message: 'You are not allowed to view audit records.', status: 403, category: 'permission_denied' });
    }
    const item = await this.audit.getById(id);
    if (!item || item.tenantId !== context.session.activeTenant.id) throw new WorkflowError({ code: 'audit_not_found', message: 'Audit record not found.', status: 404, category: 'validation_failure' });
    return item;
  }
}
