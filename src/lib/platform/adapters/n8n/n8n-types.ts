export type N8nWorkflowRecord = {
  id: string;
  name: string;
  active: boolean;
};

export type N8nExecutionRecord = {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  started_at?: string;
  finished_at?: string;
  result_summary?: string;
};

export type N8nTriggerResponseRecord = {
  accepted: boolean;
  execution_id?: string;
  status: string;
};
