import type { CaseDetail, CaseSummary, DecisionDetail, DecisionSummary, RiskSummary, SourceReference } from '../../integrations/types';
import type { MarbleCaseRecord, MarbleDecisionRecord, MarbleRiskRecord } from './marble-types';

function sourceRef(type: string, id: string, baseUrl?: string): SourceReference {
  return {
    sourceSystem: 'marble',
    sourceRecordType: type,
    sourceRecordId: id,
    sourceUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/${type}/${id}` : undefined,
    syncedAt: new Date().toISOString(),
  };
}

export function mapDecisionSummary(record: MarbleDecisionRecord, baseUrl?: string): DecisionSummary {
  return {
    id: record.id,
    subjectId: record.subject_id,
    outcome: record.outcome,
    reviewState: record.review_status,
    reasonCodes: record.reason_codes ?? [],
    createdAt: record.created_at,
    sourceRef: sourceRef('decision', record.id, baseUrl),
  };
}

export function mapDecisionDetail(record: MarbleDecisionRecord, baseUrl?: string): DecisionDetail {
  return {
    ...mapDecisionSummary(record, baseUrl),
    score: record.score,
    caseId: record.case_id,
  };
}

export function mapCaseSummary(record: MarbleCaseRecord, baseUrl?: string): CaseSummary {
  return {
    id: record.id,
    subjectId: record.subject_id,
    status: record.status,
    queue: record.queue,
    createdAt: record.created_at,
    sourceRef: sourceRef('case', record.id, baseUrl),
  };
}

export function mapCaseDetail(record: MarbleCaseRecord, baseUrl?: string): CaseDetail {
  return {
    ...mapCaseSummary(record, baseUrl),
    assignee: record.assignee,
    resolution: record.resolution,
  };
}

export function mapRiskSummary(record: MarbleRiskRecord, baseUrl?: string): RiskSummary {
  return {
    subjectId: record.subject_id,
    riskLevel: record.risk_level,
    latestDecisionId: record.latest_decision_id,
    flags: record.flags ?? [],
    sourceRef: sourceRef('risk-summary', record.subject_id, baseUrl),
  };
}
