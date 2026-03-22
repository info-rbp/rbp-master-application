import type { ApplicationDetail, ApplicationSummary, BorrowerSummary, DocumentSummary, LoanDetail, LoanSummary, RequirementSummary, SourceReference } from '../../integrations/types';
import type { LendingApplicationRecord, LendingBorrowerRecord, LendingDocumentRecord, LendingLoanRecord, LendingRequirementRecord } from './lending-types';

function sourceRef(type: string, id: string, baseUrl?: string): SourceReference {
  return {
    sourceSystem: 'lending',
    sourceRecordType: type,
    sourceRecordId: id,
    sourceUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/app/${type}/${id}` : undefined,
    syncedAt: new Date().toISOString(),
  };
}

export function mapApplicationSummary(record: LendingApplicationRecord, baseUrl?: string): ApplicationSummary {
  return {
    id: record.id,
    applicantId: record.applicant_id,
    applicantName: record.applicant_name,
    status: record.status,
    productName: record.product_name,
    submittedAt: record.submitted_at,
    sourceRef: sourceRef('application', record.id, baseUrl),
  };
}

export function mapApplicationDetail(record: LendingApplicationRecord, baseUrl?: string): ApplicationDetail {
  return {
    ...mapApplicationSummary(record, baseUrl),
    requestedAmount: record.requested_amount,
    currency: record.currency,
    stage: record.stage,
  };
}

export function mapLoanSummary(record: LendingLoanRecord, baseUrl?: string): LoanSummary {
  return {
    id: record.id,
    borrowerId: record.borrower_id,
    borrowerName: record.borrower_name,
    status: record.status,
    principalAmount: record.principal_amount,
    outstandingAmount: record.outstanding_amount,
    currency: record.currency,
    sourceRef: sourceRef('loan', record.id, baseUrl),
  };
}

export function mapLoanDetail(record: LendingLoanRecord, baseUrl?: string): LoanDetail {
  return {
    ...mapLoanSummary(record, baseUrl),
    servicingState: record.servicing_state,
    nextPaymentDueAt: record.next_payment_due_at,
  };
}

export function mapBorrower(record: LendingBorrowerRecord, baseUrl?: string): BorrowerSummary {
  return {
    id: record.id,
    displayName: record.full_name,
    email: record.email,
    phone: record.phone,
    status: record.status,
    sourceRef: sourceRef('borrower', record.id, baseUrl),
  };
}

export function mapRequirement(record: LendingRequirementRecord, baseUrl?: string): RequirementSummary {
  return {
    id: record.id,
    name: record.label,
    status: record.status,
    required: record.required ?? true,
    sourceRef: sourceRef('requirement', record.id, baseUrl),
  };
}

export function mapDocument(record: LendingDocumentRecord, baseUrl?: string): DocumentSummary {
  return {
    id: record.id,
    name: record.file_name,
    status: record.status,
    uploadedAt: record.uploaded_at,
    sourceRef: sourceRef('document', record.id, baseUrl),
  };
}
