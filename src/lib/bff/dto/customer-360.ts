import type { ComplianceSummaryDto, DocumentSummaryDto, FinancialSummaryDto, QuickActionDto, TimelineEventDto, WarningDto } from './common';

export type Customer360Dto = {
  customer: { id: string; name: string; status: { category: string; code: string; label: string }; sourceRefs: unknown[] };
  profile: { type: 'organisation' | 'person'; email?: string; phone?: string; tags: string[]; addresses: string[] };
  relationships: { relatedApplications: number; relatedLoans: number; relatedSupportCases: number };
  financialSummary?: FinancialSummaryDto;
  applicationsSummary: { total: number; items: Array<{ id: string; applicantName: string; status: { category: string; code: string; label: string }; submittedAt?: string }> };
  loansSummary: { total: number; items: Array<{ id: string; borrowerName: string; status: { category: string; code: string; label: string }; outstandingAmount?: number }> };
  supportSummary: { total: number; open: number; items: Array<{ id: string; subject: string; status: { category: string; code: string; label: string } }> };
  documentsSummary?: DocumentSummaryDto;
  complianceSummary?: ComplianceSummaryDto;
  timeline: TimelineEventDto[];
  tasks: Array<{ id: string; title: string; status: { category: string; code: string; label: string } }>;
  quickActions: QuickActionDto[];
  warnings: WarningDto[];
};
