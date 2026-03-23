import { getAuditStore } from '@/lib/audit/store';
import type { AuditEvent, AuditListDto, AuditQueryInput, AuditRecordInput } from '@/lib/audit/types';

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const clone = JSON.parse(JSON.stringify(metadata ?? {}));
  for (const key of ['password', 'token', 'accessToken', 'refreshToken', 'authorization']) {
    if (key in clone) clone[key] = '[redacted]';
  }
  return clone;
}

export class AuditService {
  private readonly store = getAuditStore();

  async record(input: AuditRecordInput): Promise<AuditEvent> {
    const event: AuditEvent = {
      ...input,
      id: input.id ?? `aud_${crypto.randomUUID()}`,
      timestamp: input.timestamp ?? new Date().toISOString(),
      relatedEntityRefs: input.relatedEntityRefs ?? [],
      metadata: sanitizeMetadata(input.metadata ?? {}),
    };
    await this.store.append(event);
    return event;
  }

  async recordMany(inputs: AuditRecordInput[]) { return Promise.all(inputs.map((item) => this.record(item))); }
  async getById(id: string) { return this.store.getById(id); }

  async query(filters: AuditQueryInput): Promise<AuditListDto> {
    const limit = filters.limit ?? 50;
    const items = (await this.store.query())
      .filter((item) => item.tenantId === filters.tenantId)
      .filter((item) => !filters.workspaceId || item.workspaceId === filters.workspaceId)
      .filter((item) => !filters.actorId || item.actorId === filters.actorId)
      .filter((item) => !filters.category || item.category === filters.category)
      .filter((item) => !filters.eventType || item.eventType === filters.eventType)
      .filter((item) => !filters.subjectEntityType || item.subjectEntityType === filters.subjectEntityType)
      .filter((item) => !filters.subjectEntityId || item.subjectEntityId === filters.subjectEntityId)
      .filter((item) => !filters.targetEntityType || item.targetEntityType === filters.targetEntityType)
      .filter((item) => !filters.targetEntityId || item.targetEntityId === filters.targetEntityId)
      .filter((item) => !filters.outcome || item.outcome === filters.outcome)
      .filter((item) => !filters.dateFrom || item.timestamp >= filters.dateFrom)
      .filter((item) => !filters.dateTo || item.timestamp <= filters.dateTo)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    const offset = filters.cursor ? Number(filters.cursor) : 0;
    const page = items.slice(offset, offset + limit);
    return { items: page, pagination: { limit, total: items.length, nextCursor: offset + limit < items.length ? String(offset + limit) : undefined } };
  }
}
