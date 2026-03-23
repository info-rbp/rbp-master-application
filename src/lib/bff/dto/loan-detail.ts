import type { ComplianceSummaryDto, DocumentSummaryDto, FinancialSummaryDto, QuickActionDto, TimelineEventDto, WarningDto } from './common';

export type LoanDetailDto = {
  loan: { id: string; borrowerName: string; status: { category: string; code: string; label: string }; servicingState?: { category: string; code: string; label: string }; sourceRefs: unknown[] };
  borrower: { id?: string; name: string; email?: string; phone?: string };
  financialSummary: FinancialSummaryDto;
  repaymentSummary: { nextPaymentDueAt?: string; overdueAmount?: number; scheduleStatus: { category: string; code: string; label: string } };
  servicingSummary: { servicingState?: { category: string; code: string; label: string }; workflowStatus?: { category: string; code: string; label: string } };
  documents?: DocumentSummaryDto;
  complianceSummary?: ComplianceSummaryDto;
  tasks: Array<{ id: string; title: string; status: { category: string; code: string; label: string } }>;
  timeline: TimelineEventDto[];
  quickActions: QuickActionDto[];
  warnings: WarningDto[];
};
