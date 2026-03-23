import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { TaskProvider, TaskQuery, TaskRecord } from '@/lib/tasks/types';

export class OdooTaskProvider implements TaskProvider {
  readonly key = 'odoo';
  private readonly adapters = getPlatformAdapters();

  async listTasks(query: TaskQuery) {
    const ctx = { correlationId: query.correlationId, tenantId: query.tenantId, workspaceId: query.workspaceId, actingUserId: query.userId };
    const [tickets, invoices] = await Promise.all([
      this.adapters.odoo.listSupportTickets({ status: 'open', limit: Math.min(query.pageSize * 2, 20) }, ctx),
      query.internalUser ? this.adapters.odoo.listInvoices({ status: 'posted', limit: Math.min(query.pageSize * 2, 20) }, ctx) : Promise.resolve({ data: [], meta: { correlationId: query.correlationId, source: this.adapters.odoo.getSourceInfo(), receivedAt: new Date().toISOString() } }),
    ]);
    const items: TaskRecord[] = [
      ...tickets.data.map((item) => ({
        id: `odoo:support:${item.id}`,
        taskType: 'support_follow_up',
        title: item.subject,
        description: item.ticketNumber,
        tenantId: query.tenantId,
        workspaceId: query.workspaceId,
        status: 'open' as const,
        priority: item.priority === 'high' ? 'high' : 'normal',
        urgencyScore: item.priority === 'high' ? 74 : 45,
        sourceSystem: 'odoo' as const,
        sourceRef: item.sourceRef,
        sourceTaskType: 'support_ticket',
        relatedEntityType: 'support_ticket',
        relatedEntityId: item.id,
        relatedEntityDisplay: item.subject,
        assigneeType: 'queue' as const,
        assigneeId: 'support',
        assigneeDisplay: 'Support',
        queue: 'support',
        dueAt: item.updatedAt,
        createdAt: item.createdAt ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
        availableActions: [{ key: 'open', label: 'Open', type: 'navigate', enabled: true, requiresConfirmation: false, route: `/portal/support?ticket=${item.id}` }],
        warnings: [],
        metadata: {},
        moduleKey: 'support',
      })),
      ...invoices.data.filter((item) => item.amountDue > 0).map((item) => ({
        id: `odoo:invoice:${item.id}`,
        taskType: 'finance_follow_up',
        title: `Invoice ${item.invoiceNumber} overdue`,
        description: item.customerName,
        tenantId: query.tenantId,
        workspaceId: query.workspaceId,
        status: 'blocked' as const,
        priority: item.amountDue > 1000 ? 'urgent' : 'high',
        urgencyScore: item.amountDue > 1000 ? 88 : 68,
        sourceSystem: 'odoo' as const,
        sourceRef: item.sourceRef,
        sourceTaskType: 'invoice',
        relatedEntityType: 'invoice',
        relatedEntityId: item.id,
        assigneeType: 'queue' as const,
        assigneeId: 'finance_ops',
        assigneeDisplay: 'Finance ops',
        queue: 'finance_ops',
        dueAt: item.dueDate,
        createdAt: item.createdAt ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
        availableActions: [{ key: 'open', label: 'Open', type: 'navigate', enabled: true, requiresConfirmation: false, route: `/admin/membership/subscription-and-billing-oversight?invoice=${item.id}` }],
        warnings: [],
        metadata: { amountDue: item.amountDue },
        moduleKey: 'finance',
      })),
    ].filter((item) => !query.search || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.search.toLowerCase()));
    return { items };
  }

  async getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>) {
    const items = await this.listTasks({ tenantId: query.tenantId, userId: query.userId, internalUser: query.internalUser, page: 1, pageSize: 100, correlationId: query.correlationId });
    return items.items.find((item) => item.id === taskId) ?? null;
  }

  supportsAction(task: TaskRecord, action: string) {
    return task.sourceSystem === 'odoo' && ['escalate'].includes(action);
  }
}
