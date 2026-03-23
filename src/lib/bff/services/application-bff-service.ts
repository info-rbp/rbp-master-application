import type { ApplicationDetailDto } from '@/lib/bff/dto/application-detail';
import { normalizeStatus } from '@/lib/bff/utils/status';
import { BffApiError, requireModule, requirePermission, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { adapterContext, buildQuickAction, buildTimelineEvent, getAdapters, tryOrWarn } from './shared';

export class ApplicationBffService {
  async getApplication(id: string, context: BffRequestContext): Promise<ApplicationDetailDto> {
    requireModule(context, 'applications');
    requirePermission(context, 'application', 'read');
    const adapters = getAdapters();
    const ctx = adapterContext(context);
    const warnings = [] as ApplicationDetailDto['warnings'];

    const application = await adapters.lending.getApplicationById(id, ctx).catch(() => null);
    if (!application) throw new BffApiError('not_found', 'Application was not found.', 404);

    const [requirements, documents, decision, workflow, borrower] = await Promise.all([
      adapters.lending.listApplicationRequirements(id, ctx),
      adapters.lending.listApplicationDocuments(id, ctx),
      tryOrWarn(() => adapters.marble.getDecisionById(id, ctx), { code: 'decision_unavailable', message: 'Decision summary is temporarily unavailable.', sourceSystem: 'marble', retryable: true }),
      tryOrWarn(() => adapters.n8n.getWorkflowStatus({ workflowId: `application-${id}` }, ctx), { code: 'workflow_unavailable', message: 'Workflow status is temporarily unavailable.', sourceSystem: 'n8n', retryable: true }),
      application.data.applicantId ? tryOrWarn(() => adapters.lending.getBorrowerById(application.data.applicantId!, ctx), { code: 'applicant_unavailable', message: 'Applicant profile is temporarily unavailable.', sourceSystem: 'lending', retryable: true }) : Promise.resolve({}),
    ]);

    [decision.warning, workflow.warning, borrower.warning].filter(Boolean).forEach((warning) => warnings.push(warning!));
    return {
      application: { id: application.data.id, applicantName: application.data.applicantName, productName: application.data.productName, stage: application.data.stage, status: normalizeStatus('application', application.data.status), submittedAt: application.data.submittedAt, requestedAmount: application.data.requestedAmount, currency: application.data.currency, sourceRefs: [application.data.sourceRef] },
      applicant: { id: application.data.applicantId, name: application.data.applicantName, email: borrower.data?.data.email, phone: borrower.data?.data.phone },
      requirements: { total: requirements.data.length, completed: requirements.data.filter((item) => item.status === 'received').length, pending: requirements.data.filter((item) => item.status !== 'received').length, items: requirements.data.map((item) => ({ id: item.id, name: item.name, required: item.required, status: normalizeStatus('application', item.status) })) },
      documents: { total: documents.data.length, uploaded: documents.data.filter((item) => item.status === 'received').length, pending: documents.data.filter((item) => item.status !== 'received').length, items: documents.data.map((item) => ({ id: item.id, name: item.name, uploadedAt: item.uploadedAt, status: normalizeStatus('application', item.status), sourceRefs: [item.sourceRef] })) },
      decisionSummary: decision.data ? { status: normalizeStatus('decision', decision.data.data.outcome), riskLevel: decision.data.data.outcome, reasonCodes: decision.data.data.reasonCodes, sourceRefs: [decision.data.data.sourceRef] } : undefined,
      workflow: workflow.data ? { status: normalizeStatus('workflow', workflow.data.data.status), workflowId: workflow.data.data.workflowId, executionId: workflow.data.data.id } : undefined,
      tasks: requirements.data.filter((item) => item.status !== 'received').map((item) => ({ id: `requirement.${item.id}`, title: `Collect ${item.name}`, status: normalizeStatus('task', item.status) })),
      timeline: [
        buildTimelineEvent({ id: `application.${application.data.id}`, eventType: 'application.submitted', title: `Application ${application.data.id}`, description: application.data.stage, timestamp: application.data.submittedAt, sourceSystem: 'lending', relatedEntityType: 'application', relatedEntityId: application.data.id, sourceRefs: [application.data.sourceRef] }),
        ...(decision.data ? [buildTimelineEvent({ id: `decision.${decision.data.data.id}`, eventType: 'decision.recorded', title: 'Decision updated', description: decision.data.data.outcome, timestamp: decision.data.data.createdAt, sourceSystem: 'marble', relatedEntityType: 'application', relatedEntityId: application.data.id, sourceRefs: [decision.data.data.sourceRef] })] : []),
      ],
      quickActions: [buildQuickAction({ key: 'open_customer', label: 'Open customer 360', type: 'navigate', route: application.data.applicantId ? `/api/customers/${application.data.applicantId}/360` : undefined, enabled: Boolean(application.data.applicantId) })],
      warnings,
    };
  }
}
