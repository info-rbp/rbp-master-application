import type { TaskListDto } from '@/lib/bff/dto/task';
import { normalizeStatus } from '@/lib/bff/utils/status';
import { requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { adapterContext, getAdapters } from './shared';

export class TaskInboxBffService {
  async listTasks(context: BffRequestContext, filters: { status?: string; sourceSystem?: string; relatedEntityType?: string; relatedEntityId?: string; limit?: number } = {}): Promise<TaskListDto> {
    requirePermission(context, 'dashboard', 'read');
    const adapters = getAdapters();
    const ctx = adapterContext(context);
    const [applications, cases, tickets] = await Promise.all([
      adapters.lending.listApplications(filters.status ? { status: filters.status, limit: filters.limit ?? 20 } : { limit: filters.limit ?? 20 }, ctx),
      adapters.marble.listCases(filters.status ? { status: filters.status, limit: filters.limit ?? 20 } : { limit: filters.limit ?? 20 }, ctx),
      adapters.odoo.listSupportTickets(filters.status ? { status: filters.status, limit: filters.limit ?? 20 } : { limit: filters.limit ?? 20 }, ctx),
    ]);

    const items = [
      ...applications.data.map((item) => ({ id: `lending:${item.id}`, taskType: 'application_review', title: `Review application ${item.id}`, description: item.applicantName, status: normalizeStatus('task', item.status), priority: item.status === 'submitted' ? 'high' : 'medium', sourceSystem: 'lending', relatedEntityType: 'application', relatedEntityId: item.id, dueAt: item.submittedAt, availableActions: [{ key: 'open', label: 'Open' }, { key: 'approve', label: 'Approve' }], sourceRefs: [item.sourceRef] })),
      ...cases.data.map((item) => ({ id: `marble:${item.id}`, taskType: 'compliance_case', title: `Review compliance case ${item.id}`, description: item.queue, status: normalizeStatus('task', item.status), priority: 'critical', sourceSystem: 'marble', relatedEntityType: 'case', relatedEntityId: item.id, queue: item.queue, dueAt: item.createdAt, availableActions: [{ key: 'open', label: 'Open' }], sourceRefs: [item.sourceRef] })),
      ...tickets.data.map((item) => ({ id: `odoo:${item.id}`, taskType: 'support_follow_up', title: item.subject, description: item.ticketNumber, status: normalizeStatus('task', item.status), priority: item.priority === 'high' ? 'high' : 'medium', sourceSystem: 'odoo', relatedEntityType: 'supportTicket', relatedEntityId: item.id, dueAt: item.updatedAt, availableActions: [{ key: 'open', label: 'Open' }], sourceRefs: [item.sourceRef] })),
    ].filter((item) => !filters.sourceSystem || item.sourceSystem === filters.sourceSystem)
      .filter((item) => !filters.relatedEntityType || item.relatedEntityType === filters.relatedEntityType)
      .filter((item) => !filters.relatedEntityId || item.relatedEntityId === filters.relatedEntityId)
      .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));

    return {
      items,
      summary: { total: items.length, open: items.filter((item) => item.status.category !== 'completed').length, overdue: items.filter((item) => item.status.code === 'overdue').length, bySource: items.reduce<Record<string, number>>((acc, item) => { acc[item.sourceSystem] = (acc[item.sourceSystem] ?? 0) + 1; return acc; }, {}) },
      filters: { status: ['pending', 'open', 'review', 'overdue'], sourceSystem: ['lending', 'marble', 'odoo'] },
      pagination: { limit: filters.limit ?? 20, total: items.length },
    };
  }

  async runAction(context: BffRequestContext, taskId: string, action: string) {
    requirePermission(context, 'application', 'read');
    return { taskId, action, accepted: ['open', 'approve', 'resolve'].includes(action) };
  }
}
