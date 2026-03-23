import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { SearchProvider, SearchQuery } from '@/lib/search/types';

export class MarbleSearchProvider implements SearchProvider {
  readonly key = 'marble';
  readonly supportedEntityTypes = ['case'] as const;
  private readonly adapters = getPlatformAdapters();

  supports(query: SearchQuery) {
    return !query.entityTypes || query.entityTypes.includes('case');
  }

  getEntityTypeSupport() { return [...this.supportedEntityTypes]; }
  async getHealth() { return { key: this.key, status: 'healthy' as const }; }

  async search(query: SearchQuery) {
    const ctx = { correlationId: query.correlationId, tenantId: query.tenantId, workspaceId: query.workspaceId, actingUserId: query.currentUserId };
    const cases = await this.adapters.marble.listCases({ status: typeof query.filters.status === 'string' ? query.filters.status : undefined, limit: Math.min(query.pageSize * 2, 20) }, ctx);
    return {
      providerKey: this.key,
      items: cases.data.map((item) => ({ id: `search:case:${item.id}`, resultType: 'entity', entityType: 'case', entityId: item.id, moduleKey: 'applications', title: item.id, subtitle: item.queue, description: item.queue, status: item.status, badges: ['Compliance'], highlights: [item.id], route: `/admin/crm?case=${item.id}`, sourceSystem: 'marble', sourceRefs: [item.sourceRef], score: item.status === 'open' ? 26 : 12, matchedFields: ['id'], createdAt: item.createdAt, updatedAt: item.createdAt, accessLevel: 'internal', meta: { queue: item.queue } })).filter((item) => !query.query || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.query.toLowerCase())),
    };
  }
}
