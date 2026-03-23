import { getPlatformAdapters } from '@/lib/platform/adapters/factory';
import type { SearchProvider, SearchQuery } from '@/lib/search/types';

export class OdooSearchProvider implements SearchProvider {
  readonly key = 'odoo';
  readonly supportedEntityTypes = ['customer', 'invoice', 'support_ticket', 'knowledge'] as const;
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

    if (!query.entityTypes || query.entityTypes.includes('customer')) {
      const customers = await this.adapters.odoo.findCustomers({ search: query.query, limit }, ctx);
      items.push(...customers.data.map((item) => ({ id: `search:customer:${item.id}`, resultType: 'entity', entityType: 'customer', entityId: item.id, moduleKey: 'customers', title: item.displayName, subtitle: item.email, description: item.companyName, status: item.status, badges: ['Customer'], highlights: [item.displayName], route: `/customers/${item.id}`, sourceSystem: 'odoo', sourceRefs: [item.sourceRef], score: 20, matchedFields: ['displayName', item.email ? 'email' : ''].filter(Boolean),  accessLevel: 'internal', meta: {} })));
    }
    if (!query.entityTypes || query.entityTypes.includes('invoice')) {
      const invoices = await this.adapters.odoo.listInvoices({ status: typeof query.filters.status === 'string' ? query.filters.status : undefined, limit }, ctx);
      items.push(...invoices.data.map((item) => ({ id: `search:invoice:${item.id}`, resultType: 'entity', entityType: 'invoice', entityId: item.id, moduleKey: 'finance', title: item.invoiceNumber, subtitle: item.customerName, description: item.customerName ? `Customer ${item.customerName}` : (item.amountDue ? `Amount due ${item.amountDue} ${item.currency}` : undefined), status: item.status, badges: [item.amountDue > 0 ? 'Payment due' : 'Invoice'], highlights: [item.invoiceNumber], route: `/admin/membership/subscription-and-billing-oversight?invoice=${item.id}`, sourceSystem: 'odoo', sourceRefs: [item.sourceRef], score: item.amountDue > 0 ? 30 : 16, matchedFields: ['invoiceNumber'],   accessLevel: 'internal', meta: { amountDue: item.amountDue } })).filter((item) => !query.query || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.query.toLowerCase())));
    }
    if (!query.entityTypes || query.entityTypes.includes('support_ticket')) {
      const tickets = await this.adapters.odoo.listSupportTickets({ status: typeof query.filters.status === 'string' ? query.filters.status : undefined, limit }, ctx);
      items.push(...tickets.data.map((item) => ({ id: `search:support:${item.id}`, resultType: 'entity', entityType: 'support_ticket', entityId: item.id, moduleKey: 'support', title: item.subject, subtitle: item.ticketNumber, description: item.customerId, status: item.status, badges: ['Support'], highlights: [item.subject], route: `/portal/support?ticket=${item.id}`, sourceSystem: 'odoo', sourceRefs: [item.sourceRef], score: item.status === 'open' ? 24 : 15, matchedFields: ['subject', 'ticketNumber'],   accessLevel: 'tenant', meta: { priority: item.priority } })).filter((item) => !query.query || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.query.toLowerCase())));
    }
    if (!query.entityTypes || query.entityTypes.includes('knowledge')) {
      const knowledge = await this.adapters.odoo.listKnowledgeItems({ search: query.query, limit }, ctx);
      items.push(...knowledge.data.map((item) => ({ id: `search:knowledge:${item.id}`, resultType: 'entity', entityType: 'knowledge', entityId: item.id, moduleKey: 'knowledge', title: item.title, subtitle: item.slug, description: item.summary, status: item.status, badges: ['Knowledge'], highlights: [item.title], route: `/knowledge-center/${item.id}`, sourceSystem: 'odoo', sourceRefs: [item.sourceRef], score: 18, matchedFields: ['title'], accessLevel: 'tenant', meta: {} })));
    }

    return { providerKey: this.key, items };
  }
}
