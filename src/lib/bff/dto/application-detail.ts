import type { ComplianceSummaryDto, DocumentSummaryDto, QuickActionDto, TimelineEventDto, WarningDto } from './common';

export type ApplicationDetailDto = {
  application: { id: string; applicantName: string; productName?: string; stage?: string; status: { category: string; code: string; label: string }; submittedAt?: string; requestedAmount?: number; currency?: string; sourceRefs: unknown[] };
  applicant: { id?: string; name: string; email?: string; phone?: string };
  requirements: { total: number; completed: number; pending: number; items: Array<{ id: string; name: string; required: boolean; status: { category: string; code: string; label: string } }> };
  documents: DocumentSummaryDto;
  decisionSummary?: ComplianceSummaryDto;
  workflow?: { status: { category: string; code: string; label: string }; workflowId?: string; executionId?: string };
  tasks: Array<{ id: string; title: string; status: { category: string; code: string; label: string }; dueAt?: string }>;
  timeline: TimelineEventDto[];
  quickActions: QuickActionDto[];
  warnings: WarningDto[];
};
