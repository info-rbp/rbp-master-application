import type { DashboardDto } from '@/lib/bff/dto/dashboard';
import { requireModule, requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { adapterContext, buildQuickAction, buildTimelineEvent, getAdapters, tryOrWarn } from './shared';
import { normalizeStatus } from '@/lib/bff/utils/status';
import { getUnreadNotificationCount, listNotificationsForActor } from '@/lib/notifications';

export class DashboardBffService {
  async getDashboard(context: BffRequestContext): Promise<DashboardDto> {
    requireModule(context, 'dashboard');
    requirePermission(context, 'dashboard', 'read');
    const adapters = getAdapters();
    const ctx = adapterContext(context);
    const warnings = [] as DashboardDto['warnings'];

    const [company, applications, loans, invoices, tickets, decisions, workflows, notifications] = await Promise.all([
      adapters.odoo.getCompanyContext(ctx),
      tryOrWarn(() => adapters.lending.listApplications({ limit: 5 }, ctx), { code: 'applications_unavailable', message: 'Application summary is temporarily unavailable.', sourceSystem: 'lending', retryable: true }),
      tryOrWarn(() => adapters.lending.listLoans({ limit: 5 }, ctx), { code: 'loans_unavailable', message: 'Loan summary is temporarily unavailable.', sourceSystem: 'lending', retryable: true }),
      tryOrWarn(() => adapters.odoo.listInvoices({ limit: 5 }, ctx), { code: 'invoices_unavailable', message: 'Billing summary is temporarily unavailable.', sourceSystem: 'odoo', retryable: true }),
      tryOrWarn(() => adapters.odoo.listSupportTickets({ limit: 5 }, ctx), { code: 'support_unavailable', message: 'Support summary is temporarily unavailable.', sourceSystem: 'odoo', retryable: true }),
      tryOrWarn(() => adapters.marble.listDecisions({ limit: 5 }, ctx), { code: 'decisions_unavailable', message: 'Decision summary is temporarily unavailable.', sourceSystem: 'marble', retryable: true }),
      tryOrWarn(() => adapters.n8n.listWorkflowExecutions({ limit: 5 }, ctx), { code: 'workflows_unavailable', message: 'Workflow summary is temporarily unavailable.', sourceSystem: 'n8n', retryable: true }),
      listNotificationsForActor({ userId: context.session.user.id, role: context.internalUser ? 'admin' : 'member' }),
    ]);

    [applications.warning, loans.warning, invoices.warning, tickets.warning, decisions.warning, workflows.warning].filter(Boolean).forEach((warning) => warnings.push(warning!));

    const metrics = [
      { key: 'applications', label: 'Applications', value: applications.data?.data.length ?? 0 },
      { key: 'loans', label: 'Loans', value: loans.data?.data.length ?? 0 },
      { key: 'openTickets', label: 'Open support', value: tickets.data?.data.filter((item) => item.status === 'open').length ?? 0, status: normalizeStatus('support', 'open') },
      { key: 'invoiceDue', label: 'Invoices due', value: invoices.data?.data.reduce((sum, item) => sum + item.amountDue, 0) ?? 0, status: normalizeStatus('invoice', (invoices.data?.data.some((item) => item.amountDue > 0) ? 'overdue' : 'posted')) },
    ];

    return {
      tenantSummary: { tenantId: context.session.activeTenant.id, tenantName: company.data.companyName, workspaceName: context.session.activeWorkspace?.name },
      userSummary: { userId: context.session.user.id, displayName: context.session.user.displayName, internalUser: context.internalUser },
      metrics,
      sections: [
        { key: 'applications', title: 'Application pipeline', items: [{ key: 'submitted', label: 'Recent applications', value: applications.data?.data.length ?? 0 }] },
        { key: 'support', title: 'Support and service', items: [{ key: 'open', label: 'Open tickets', value: tickets.data?.data.filter((item) => item.status === 'open').length ?? 0 }] },
      ],
      recentActivity: [
        ...(applications.data?.data ?? []).slice(0, 2).map((item) => buildTimelineEvent({ id: `application.${item.id}`, eventType: 'application.updated', title: `Application ${item.id}`, description: item.applicantName, timestamp: item.submittedAt, sourceSystem: 'lending', relatedEntityType: 'application', relatedEntityId: item.id, sourceRefs: [item.sourceRef] })),
        ...(workflows.data?.data ?? []).slice(0, 2).map((item) => buildTimelineEvent({ id: `workflow.${item.id}`, eventType: 'workflow.execution', title: item.workflowName ?? 'Workflow execution', description: item.status, timestamp: item.startedAt, sourceSystem: 'n8n', relatedEntityType: 'workflowExecution', relatedEntityId: item.id, sourceRefs: [item.sourceRef] })),
      ].slice(0, 5),
      taskSummary: {
        total: (applications.data?.data.length ?? 0) + (tickets.data?.data.filter((item) => item.status === 'open').length ?? 0),
        open: (applications.data?.data.filter((item) => item.status === 'submitted').length ?? 0) + (tickets.data?.data.filter((item) => item.status === 'open').length ?? 0),
        overdue: invoices.data?.data.filter((item) => item.amountDue > 0).length ?? 0,
        highPriority: decisions.data?.data.filter((item) => item.outcome === 'review').length ?? 0,
      },
      notificationsSummary: {
        total: notifications.length,
        unread: await getUnreadNotificationCount({ userId: context.session.user.id, role: context.internalUser ? 'admin' : 'member' }),
        highSeverity: notifications.filter((item) => item.severity === 'error' || item.severity === 'warning').length,
      },
      quickActions: [
        buildQuickAction({ key: 'open_tasks', label: 'Open task inbox', type: 'navigate', route: '/tasks' }),
        buildQuickAction({ key: 'open_support', label: 'Open support', type: 'navigate', route: '/portal/support', enabled: context.session.enabledModules.includes('support') }),
      ],
      warnings,
    };
  }
}
