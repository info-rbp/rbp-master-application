import type { LoanDetailDto } from '@/lib/bff/dto/loan-detail';
import { normalizeStatus } from '@/lib/bff/utils/status';
import { requireActionPolicyAccess } from '@/lib/access/evaluators';
import { BffApiError, requireModule, requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { adapterContext, buildQuickAction, buildTimelineEvent, getAdapters, tryOrWarn } from './shared';

export class LoanBffService {
  async getLoan(id: string, context: BffRequestContext): Promise<LoanDetailDto> {
    await requireActionPolicyAccess('loans.detail.view', context);
    requireModule(context, 'loans');
    requirePermission(context, 'loan', 'read');
    const adapters = getAdapters();
    const ctx = adapterContext(context);
    const warnings = [] as LoanDetailDto['warnings'];

    const loan = await adapters.lending.getLoanById(id, ctx).catch(() => null);
    if (!loan) throw new BffApiError('not_found', 'Loan was not found.', 404);

    const [borrower, invoices, risk, workflow] = await Promise.all([
      loan.data.borrowerId ? tryOrWarn(() => adapters.lending.getBorrowerById(loan.data.borrowerId!, ctx), { code: 'borrower_unavailable', message: 'Borrower profile is temporarily unavailable.', sourceSystem: 'lending', retryable: true }) : Promise.resolve({}),
      tryOrWarn(() => adapters.odoo.listInvoices({ customerId: loan.data.borrowerId, limit: 5 }, ctx), { code: 'charges_unavailable', message: 'Charge snapshot is temporarily unavailable.', sourceSystem: 'odoo', retryable: true }),
      tryOrWarn(() => adapters.marble.getRiskSummaryForSubject({ subjectId: id }, ctx), { code: 'compliance_unavailable', message: 'Compliance snapshot is temporarily unavailable.', sourceSystem: 'marble', retryable: true }),
      tryOrWarn(() => adapters.n8n.getWorkflowStatus({ workflowId: `loan-${id}` }, ctx), { code: 'workflow_unavailable', message: 'Servicing workflow state is temporarily unavailable.', sourceSystem: 'n8n', retryable: true }),
    ]);

    [borrower.warning, invoices.warning, risk.warning, workflow.warning].filter(Boolean).forEach((warning) => warnings.push(warning!));
    const invoiceItems = invoices.data?.data ?? [];
    const overdue = invoiceItems.reduce((sum, item) => sum + item.amountDue, 0);

    return {
      loan: { id: loan.data.id, borrowerName: loan.data.borrowerName, status: normalizeStatus('loan', loan.data.status), servicingState: loan.data.servicingState ? normalizeStatus('loan', loan.data.servicingState) : undefined, sourceRefs: [loan.data.sourceRef] },
      borrower: { id: loan.data.borrowerId, name: loan.data.borrowerName, email: borrower.data?.data.email, phone: borrower.data?.data.phone },
      financialSummary: { currency: loan.data.currency, totalExposure: loan.data.principalAmount, outstandingAmount: loan.data.outstandingAmount, overdueAmount: overdue, invoiceCount: invoiceItems.length, status: normalizeStatus('loan', overdue > 0 ? 'overdue' : loan.data.status), sourceRefs: [loan.data.sourceRef, ...invoiceItems.map((item) => item.sourceRef)] },
      repaymentSummary: { nextPaymentDueAt: loan.data.nextPaymentDueAt, overdueAmount: overdue, scheduleStatus: normalizeStatus('loan', overdue > 0 ? 'overdue' : 'active') },
      servicingSummary: { servicingState: loan.data.servicingState ? normalizeStatus('loan', loan.data.servicingState) : undefined, workflowStatus: workflow.data ? normalizeStatus('workflow', workflow.data.data.status) : undefined },
      documents: { total: 0, uploaded: 0, pending: 0, items: [] },
      complianceSummary: risk.data ? { status: normalizeStatus('decision', risk.data.data.riskLevel), riskLevel: risk.data.data.riskLevel, reasonCodes: risk.data.data.flags, sourceRefs: [risk.data.data.sourceRef] } : undefined,
      tasks: overdue > 0 ? [{ id: `loan.overdue.${loan.data.id}`, title: 'Resolve overdue balance', status: normalizeStatus('task', 'overdue') }] : [],
      timeline: [
        buildTimelineEvent({ id: `loan.${loan.data.id}`, eventType: 'loan.updated', title: `Loan ${loan.data.id}`, description: loan.data.status, timestamp: loan.data.nextPaymentDueAt, sourceSystem: 'lending', relatedEntityType: 'loan', relatedEntityId: loan.data.id, sourceRefs: [loan.data.sourceRef] }),
      ],
      quickActions: [buildQuickAction({ key: 'open_borrower', label: 'Open borrower', type: 'navigate', route: loan.data.borrowerId ? `/api/customers/${loan.data.borrowerId}/360` : undefined, enabled: Boolean(loan.data.borrowerId) })],
      warnings,
    };
  }
}
