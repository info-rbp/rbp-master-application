import type { NotificationSummaryDto, QuickActionDto, SummaryCardDto, TaskSummaryDto, TimelineEventDto, WarningDto } from './common';

export type DashboardDto = {
  tenantSummary: { tenantId: string; tenantName: string; workspaceName?: string };
  userSummary: { userId: string; displayName: string; internalUser: boolean };
  metrics: SummaryCardDto[];
  sections: Array<{ key: string; title: string; items: SummaryCardDto[] }>;
  recentActivity: TimelineEventDto[];
  taskSummary: TaskSummaryDto;
  notificationsSummary: NotificationSummaryDto;
  quickActions: QuickActionDto[];
  warnings: WarningDto[];
};
