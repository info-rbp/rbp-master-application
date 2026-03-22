import type { WorkflowFailureCategory } from '@/lib/workflows/types';

export class WorkflowError extends Error {
  code: string;
  status: number;
  category: WorkflowFailureCategory;
  retryable: boolean;
  details?: Record<string, unknown>;

  constructor(input: { code: string; message: string; status: number; category: WorkflowFailureCategory; retryable?: boolean; details?: Record<string, unknown> }) {
    super(input.message);
    this.code = input.code;
    this.status = input.status;
    this.category = input.category;
    this.retryable = Boolean(input.retryable);
    this.details = input.details;
  }
}

export function classifyUnknownFailure(error: unknown): WorkflowError {
  if (error instanceof WorkflowError) return error;
  return new WorkflowError({ code: 'workflow_unknown_failure', message: error instanceof Error ? error.message : 'Unknown workflow failure.', status: 500, category: 'unknown_failure', retryable: false });
}
