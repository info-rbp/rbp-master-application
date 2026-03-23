import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { SearchProvider, SearchQuery } from '@/lib/search/types';

export class LendingSearchProvider implements SearchProvider {
  readonly key = 'lending';
  readonly supportedEntityTypes = ['application', 'loan', 'document', 'customer'] as const;
  private readonly adapters = getPlatformAdapters();

  supports(query: SearchQuery) {
    return !query.entityTypes || query.entityTypes.some((type) => this.supportedEntityTypes.includes(type as any));
  }

  getEntityTypeSupport() { return [...this.supportedEntityTypes]; }
  async getHealth() { return { key: this.key, status: 'healthy' as const }; }

  async search(query: SearchQuery) {
    const limit = Math.min(query.pageSize * 2, 20);
    const items = [] as any[];
    const ctx = { correlationId: query.correlationId, tenantId: query.tenantId, workspaceId: query.workspaceId, actingUserId: query.currentUserId };

    if (!query.entityTypes || query.entityTypes.includes('application')) {
      const applications = await this.adapters.lending.listApplications({ status: typeof query.filters.status === 'string' ? query.filters.status : undefined, limit }, ctx);
      items.push(...applications.data.map((item) => ({ id: `search:application:${item.id}`, resultType: 'entity', entityType: 'application', entityId: item.id, moduleKey: 'applications', title: item.id, subtitle: item.applicantName, description: undefined, status: item.status, badges: ['Application'], highlights: [item.id, item.applicantName], route: `/applications/${item.id}`, sourceSystem: 'lending', sourceRefs: [item.sourceRef], score: item.status === 'submitted' ? 34 : 22, matchedFields: ['id', 'applicantName'], createdAt: item.submittedAt, updatedAt: item.submittedAt, accessLevel: 'internal', meta: { requestedAmount: item.requestedAmount } })).filter((item) => !query.query || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.query.toLowerCase())));
    }
    if (!query.entityTypes || query.entityTypes.includes('loan')) {
      const loans = await this.adapters.lending.listLoans({ status: typeof query.filters.status === 'string' ? query.filters.status : undefined, limit }, ctx);
      items.push(...loans.data.map((item) => ({ id: `search:loan:${item.id}`, resultType: 'entity', entityType: 'loan', entityId: item.id, moduleKey: 'loans', title: item.id, subtitle: item.borrowerName, description: undefined, status: item.status, badges: ['Loan'], highlights: [item.id, item.borrowerName], route: `/loans/${item.id}`, sourceSystem: 'lending', sourceRefs: [item.sourceRef], score: item.status === 'active' ? 28 : 20, matchedFields: ['id', 'borrowerName'],  accessLevel: 'internal', meta: {} })).filter((item) => !query.query || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.query.toLowerCase())));
    }
    if (!query.entityTypes || query.entityTypes.includes('customer')) {
      const borrowers = await this.adapters.lending.findBorrowers({ search: query.query, limit }, ctx);
      items.push(...borrowers.data.map((item) => ({ id: `search:borrower:${item.id}`, resultType: 'entity', entityType: 'customer', entityId: item.id, moduleKey: 'customers', title: item.displayName, subtitle: item.id, description: item.email, status: item.status, badges: ['Borrower'], highlights: [item.displayName], route: `/customers/${item.id}`, sourceSystem: 'lending', sourceRefs: [item.sourceRef], score: 18, matchedFields: ['displayName', 'id'],  accessLevel: 'internal', meta: {} })));
    }
    if ((!query.entityTypes || query.entityTypes.includes('document')) && /^app-/i.test(query.query)) {
      const docs = await this.adapters.lending.listApplicationDocuments(query.query, ctx).catch(() => null);
      if (docs) {
        items.push(...docs.data.map((item) => ({ id: `search:document:${item.id}`, resultType: 'entity', entityType: 'document', entityId: item.id, moduleKey: 'documents', title: item.name, subtitle: query.query, description: undefined, status: item.status, badges: ['Document'], highlights: [item.name], route: `/applications/${query.query}?document=${item.id}`, sourceSystem: 'lending', sourceRefs: [item.sourceRef], score: 14, matchedFields: ['name'],  accessLevel: 'tenant', meta: { ownerEntityId: query.query } })));
      }
    }

    return { providerKey: this.key, items };
  }
}
