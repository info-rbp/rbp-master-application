import type { CanonicalStatusDto } from '@/lib/bff/dto/common';

export function normalizeStatus(kind: 'application' | 'loan' | 'invoice' | 'support' | 'decision' | 'task' | 'notification' | 'workflow', value?: string): CanonicalStatusDto {
  const code = (value ?? 'unknown').toLowerCase();
  const maps: Record<string, CanonicalStatusDto> = {
    submitted: { category: 'pending', code, label: 'Submitted' },
    pending: { category: 'pending', code, label: 'Pending' },
    review: { category: 'attention', code, label: 'In review' },
    approved: { category: 'completed', code, label: 'Approved' },
    rejected: { category: 'error', code, label: 'Rejected' },
    active: { category: 'active', code, label: 'Active' },
    open: { category: 'attention', code, label: 'Open' },
    posted: { category: 'completed', code, label: 'Posted' },
    overdue: { category: 'attention', code, label: 'Overdue' },
    success: { category: 'completed', code, label: 'Completed' },
    running: { category: 'active', code, label: 'Running' },
    failed: { category: 'error', code, label: 'Failed' },
    received: { category: 'completed', code, label: 'Received' },
    unread: { category: 'attention', code, label: 'Unread' },
    read: { category: 'completed', code, label: 'Read' },
  };

  return maps[code] ?? { category: 'unknown', code, label: code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
}
