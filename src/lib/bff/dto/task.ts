export type TaskActionDto = {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  route?: string;
  apiAction?: string;
  disabledReason?: string;
};

export type TaskDto = {
  id: string;
  taskType: string;
  title: string;
  description?: string;
  tenantId: string;
  workspaceId?: string;
  status: 'open' | 'in_progress' | 'waiting_internal' | 'waiting_external' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  urgencyScore?: number;
  sourceSystem: string;
  sourceRef?: unknown;
  sourceTaskType?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityDisplay?: string;
  assigneeType: string;
  assigneeId?: string;
  assigneeDisplay?: string;
  queue?: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  availableActions: TaskActionDto[];
  warnings: Array<{ code: string; message: string }>;
  metadata: Record<string, unknown>;
  moduleKey: string;
};

export type TaskSummaryDto = {
  totalOpen: number;
  overdue: number;
  highPriority: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySourceSystem: Record<string, number>;
  byModule: Record<string, number>;
  requiresMyAttention: number;
};

export type TaskListDto = {
  items: TaskDto[];
  summary: TaskSummaryDto;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  filters: Record<string, unknown>;
  warnings: Array<{ code: string; message: string; sourceSystem?: string; retryable?: boolean }>;
  meta: Record<string, unknown>;
};

export type TaskActionResultDto = {
  success: boolean;
  task?: TaskDto | null;
  action: string;
  warnings: Array<{ code: string; message: string }>;
  meta: Record<string, unknown>;
};
