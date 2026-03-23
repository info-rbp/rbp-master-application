export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  status: 'read' | 'unread';
  sourceSystem: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  readAt?: string;
  actions: Array<{ key: string; label: string; route?: string }>;
  sourceRefs: unknown[];
};

export type NotificationListDto = {
  items: NotificationDto[];
  summary: { total: number; unread: number; highSeverity: number };
  pagination: { limit: number; total: number; nextCursor?: string };
};
