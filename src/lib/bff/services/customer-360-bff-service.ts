import type { Customer360Dto } from '@/lib/bff/dto/customer-360';
import { normalizeStatus } from '@/lib/bff/utils/status';
import { BffApiError, requireModule, requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { adapterContext, buildQuickAction, buildTimelineEvent, getAdapters, makeTask, tryOrWarn } from './shared';

export class Customer360BffService {
  async getCustomer360(id: string, context: BffRequestContext): Promise<Customer360Dto> {
    requireModule(context, 'customers');
    requirePermission(context, 'customer', 'read');
    const adapters = getAdapters();
    const ctx = adapterContext(context);
    const warnings = [] as Customer360Dto['warnings'];

    const customer = await adapters.odoo.getCustomerById(id, ctx).catch(() => null);
    if (!customer) {
      throw new BffApiError('not_found', 'Customer record was not found.', 404);
    }

    const [applications, loans, invoices, tickets, risk, workflows] = await Promise.all([
      tryOrWarn(() => adapters.lending.listApplications({ limit: 10 }, ctx), { code: 'applications_unavailable', message: 'Related applications are temporarily unavailable.', sourceSystem: 'lending', retryable: true }),
      tryOrWarn(() => adapters.lending.listLoans({ limit: 10 }, ctx), { code: 'loans_unavailable', message: 'Related loans are temporarily unavailable.', sourceSystem: 'lending', retryable: true }),
      tryOrWarn(() => adapters.odoo.listInvoices({ customerId: id, limit: 10 }, ctx), { code: 'billing_unavailable', message: 'Billing snapshot is temporarily unavailable.', sourceSystem: 'odoo', retryable: true }),
      tryOrWarn(() => adapters.odoo.listSupportTickets({ customerId: id, limit: 10 }, ctx), { code: 'support_unavailable', message: 'Support snapshot is temporarily unavailable.', sourceSystem: 'odoo', retryable: true }),
      tryOrWarn(() => adapters.marble.getRiskSummaryForSubject({ subjectId: id }, ctx), { code: 'compliance_unavailable', message: 'Risk snapshot is temporarily unavailable.', sourceSystem: 'marble', retryable: true }),
      tryOrWarn(() => adapters.n8n.listWorkflowExecutions({ limit: 5 }, ctx), { code: 'workflow_unavailable', message: 'Workflow snapshot is temporarily unavailable.', sourceSystem: 'n8n', retryable: true }),
    ]);

    [applications.warning, loans.warning, invoices.warning, tickets.warning, risk.warning, workflows.warning].filter(Boolean).forEach((warning) => warnings.push(warning!));
    const appItems = applications.data?.data ?? [];
    const loanItems = loans.data?.data ?? [];
    const invoiceItems = invoices.data?.data ?? [];
    const ticketItems = tickets.data?.data ?? [];

    return {
      customer: { id: customer.data.id, name: customer.data.displayName, status: normalizeStatus('support', customer.data.status), sourceRefs: [customer.data.sourceRef] },
      profile: { type: customer.data.companyName ? 'organisation' : 'person', email: customer.data.email, phone: customer.data.phone, tags: customer.data.tags, addresses: [customer.data.billingAddress, customer.data.shippingAddress].filter(Boolean) as string[] },
      relationships: { relatedApplications: appItems.length, relatedLoans: loanItems.length, relatedSupportCases: ticketItems.length },
      financialSummary: { currency: invoiceItems[0]?.currency, outstandingAmount: invoiceItems.reduce((sum, item) => sum + item.amountDue, 0), invoiceCount: invoiceItems.length, status: normalizeStatus('invoice', invoiceItems.some((item) => item.amountDue > 0) ? 'overdue' : 'posted'), sourceRefs: invoiceItems.map((item) => item.sourceRef) },
      applicationsSummary: { total: appItems.length, items: appItems.map((item) => ({ id: item.id, applicantName: item.applicantName, status: normalizeStatus('application', item.status), submittedAt: item.submittedAt })) },
      loansSummary: { total: loanItems.length, items: loanItems.map((item) => ({ id: item.id, borrowerName: item.borrowerName, status: normalizeStatus('loan', item.status), outstandingAmount: item.outstandingAmount })) },
      supportSummary: { total: ticketItems.length, open: ticketItems.filter((item) => item.status === 'open').length, items: ticketItems.map((item) => ({ id: item.id, subject: item.subject, status: normalizeStatus('support', item.status) })) },
      documentsSummary: { total: 0, uploaded: 0, pending: 0, items: [] },
      complianceSummary: risk.data ? { status: normalizeStatus('decision', risk.data.data.riskLevel), riskLevel: risk.data.data.riskLevel, reasonCodes: risk.data.data.flags, sourceRefs: [risk.data.data.sourceRef] } : undefined,
      timeline: [
        buildTimelineEvent({ id: `customer.${customer.data.id}`, eventType: 'customer.synced', title: 'Customer synced', description: customer.data.displayName, sourceSystem: 'odoo', relatedEntityType: 'customer', relatedEntityId: customer.data.id, sourceRefs: [customer.data.sourceRef] }),
        ...appItems.slice(0, 2).map((item) => buildTimelineEvent({ id: `application.${item.id}`, eventType: 'application.updated', title: `Application ${item.id}`, description: item.status, timestamp: item.submittedAt, sourceSystem: 'lending', relatedEntityType: 'application', relatedEntityId: item.id, sourceRefs: [item.sourceRef] })),
        ...ticketItems.slice(0, 2).map((item) => buildTimelineEvent({ id: `support.${item.id}`, eventType: 'support.updated', title: item.subject, description: item.status, timestamp: item.updatedAt, sourceSystem: 'odoo', relatedEntityType: 'supportTicket', relatedEntityId: item.id, sourceRefs: [item.sourceRef] })),
      ],
      tasks: [
        ...appItems.slice(0, 2).map((item) => ({ id: `task.application.${item.id}`, title: `Review application ${item.id}`, status: normalizeStatus('task', item.status) })),
        ...ticketItems.slice(0, 2).map((item) => ({ id: `task.support.${item.id}`, title: `Respond to ${item.subject}`, status: normalizeStatus('task', item.status) })),
      ],
      quickActions: [
        buildQuickAction({ key: 'view_customer', label: 'View CRM record', type: 'navigate', route: `/admin/crm/${id}` }),
        buildQuickAction({ key: 'open_support_case', label: 'Open support', type: 'navigate', route: `/support/new`, enabled: context.session.enabledModules.includes('support') }),
      ],
      warnings,
    };
  }
}
