import type { ModuleDefinition } from '@/lib/platform/types';
import type { SourceReference } from '@/lib/platform/integrations/types';
import type { WarningDto } from '@/lib/bff/dto/common';

export type CanonicalTaskStatus = 'open' | 'in_progress' | 'waiting_internal' | 'waiting_external' | 'blocked' | 'completed' | 'cancelled';
export type CanonicalTaskPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type TaskActionType = 'navigate' | 'api' | 'modal' | 'assign' | 'complete' | 'escalate' | 'request_info' | 'approve' | 'reject';

export type TaskAction = {
  key: string;
  label: string;
  type: TaskActionType;
  enabled: boolean;
  requiresConfirmation: boolean;
  route?: string;
  apiAction?: string;
  disabledReason?: string;
};

export type TaskRecord = {
  id: string;
  taskType: string;
  title: string;
  description?: string;
  tenantId: string;
  workspaceId?: string;
  status: CanonicalTaskStatus;
  priority: CanonicalTaskPriority;
  urgencyScore?: number;
  sourceSystem: SourceReference['sourceSystem'] | 'platform';
  sourceRef?: SourceReference;
  sourceTaskType?: string;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityDisplay?: string;
  assigneeType: 'user' | 'queue' | 'role' | 'tenant_admins';
  assigneeId?: string;
  assigneeDisplay?: string;
  queue?: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  availableActions: TaskAction[];
  warnings: WarningDto[];
  metadata: Record<string, unknown>;
  moduleKey: ModuleDefinition['key'];
};

export type TaskQuery = {
  tenantId: string;
  workspaceId?: string;
  userId: string;
  internalUser: boolean;
  page: number;
  pageSize: number;
  search?: string;
  status?: CanonicalTaskStatus;
  priority?: CanonicalTaskPriority;
  sourceSystem?: string;
  queue?: string;
  assignment?: 'mine' | 'team' | 'all';
  relatedEntityType?: string;
  relatedEntityId?: string;
  correlationId: string;
};

export type TaskSummary = {
  totalOpen: number;
  overdue: number;
  highPriority: number;
  byStatus: Partial<Record<CanonicalTaskStatus, number>>;
  byPriority: Partial<Record<CanonicalTaskPriority, number>>;
  bySourceSystem: Record<string, number>;
  byModule: Partial<Record<ModuleDefinition['key'], number>>;
  requiresMyAttention: number;
};

export type TaskListResponse = {
  items: TaskRecord[];
  summary: TaskSummary;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  filters: Record<string, unknown>;
  warnings: WarningDto[];
  meta: Record<string, unknown>;
};

export type TaskActionResult = {
  success: boolean;
  task?: TaskRecord | null;
  action: string;
  warnings: WarningDto[];
  meta: Record<string, unknown>;
};

export interface TaskProvider {
  readonly key: string;
  listTasks(query: TaskQuery): Promise<{ items: TaskRecord[]; warnings?: WarningDto[] }>;
  getTaskById(taskId: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>): Promise<TaskRecord | null>;
  supportsAction(task: TaskRecord, action: string, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>): boolean;
  performAction?(task: TaskRecord, action: string, payload: Record<string, unknown>, query: Pick<TaskQuery, 'tenantId' | 'userId' | 'internalUser' | 'correlationId'>): Promise<TaskActionResult>;
}
