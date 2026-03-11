export function computeConversionRate(checkoutStarted: number, checkoutCompleted: number) {
  if (checkoutStarted <= 0) return 0;
  return Number(((checkoutCompleted / checkoutStarted) * 100).toFixed(2));
}

export function sanitizeAnalyticsMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return {};
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

export function getUnreadCount(items: Array<{ readAt?: string }>) {
  return items.filter((item) => !item.readAt).length;
}

export function buildAuditSummary(actionType: string, targetType: string, targetId: string) {
  return `${actionType}:${targetType}:${targetId}`;
}
