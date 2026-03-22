export type MarbleDecisionRecord = {
  id: string;
  subject_id?: string;
  outcome: string;
  review_status?: string;
  reason_codes?: string[];
  created_at?: string;
  score?: number;
  case_id?: string;
};

export type MarbleCaseRecord = {
  id: string;
  subject_id?: string;
  status: string;
  queue?: string;
  created_at?: string;
  assignee?: string;
  resolution?: string;
};

export type MarbleRiskRecord = {
  subject_id: string;
  risk_level: string;
  latest_decision_id?: string;
  flags?: string[];
};
