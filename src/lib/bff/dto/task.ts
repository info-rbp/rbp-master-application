export type TaskDto = {
  id: string;
  taskType: string;
  title: string;
  description?: string;
  status: { category: string; code: string; label: string };
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceSystem: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  assignee?: string;
  queue?: string;
  dueAt?: string;
  availableActions: Array<{ key: string; label: string }>;
  sourceRefs: unknown[];
  warnings?: Array<{ code: string; message: string }>;
};

export type TaskListDto = {
  items: TaskDto[];
  summary: { total: number; open: number; overdue: number; bySource: Record<string, number> };
  filters: { status: string[]; sourceSystem: string[] };
  pagination: { limit: number; total: number; nextCursor?: string };
};
