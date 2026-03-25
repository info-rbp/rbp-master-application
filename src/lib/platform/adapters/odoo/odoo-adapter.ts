import { BasePlatformAdapter } from '../base/base-adapter';
import type { AdapterHealth } from '../../integrations/health';
import type { OdooAdapter } from '../base/types';
import type { OdooAdapterConfig } from '../../integrations/config';
import { PlatformHttpClient } from '../../integrations/http';
import { createTracingHeaders, type AdapterRequestContext } from '../../integrations/tracing';
import type { OdooCompanyRecord, OdooInvoiceRecord, OdooKnowledgeRecord, OdooPartnerRecord, OdooTicketRecord } from './odoo-types';
import { createOdooAuthHeaders } from './odoo-auth';
import { mapOdooCompanyContext, mapOdooCustomerDetail, mapOdooCustomerSummary, mapOdooInvoiceDetail, mapOdooInvoiceSummary, mapOdooKnowledgeItem, mapOdooSupportTicketDetail, mapOdooSupportTicketSummary } from './odoo-mappers';

const capabilities = [
  { key: 'customers.read', label: 'Customers', supportsWrite: true, description: 'Customer search and upsert.' },
  { key: 'finance.invoices.read', label: 'Invoices', supportsWrite: false, description: 'Invoice summaries and detail.' },
  { key: 'support.tickets.read', label: 'Support tickets', supportsWrite: false, description: 'Ticket summaries and detail.' },
  { key: 'knowledge.read', label: 'Knowledge', supportsWrite: false, description: 'Knowledge article listing.' },
  { key: 'company.read', label: 'Company context', supportsWrite: false, description: 'Company/tenant accounting context.' },
];

export class OdooPlatformAdapter extends BasePlatformAdapter implements OdooAdapter {
  constructor(private readonly config: OdooAdapterConfig, fetchImpl?: typeof fetch) {
    super(
      { adapterKey: 'odoo', displayName: 'Odoo', baseUrl: config.baseUrl, mode: config.mode },
      new PlatformHttpClient({
        sourceSystem: 'odoo',
        baseUrl: config.baseUrl,
        timeoutMs: config.timeoutMs,
        retryCount: config.retryCount,
        fetchImpl,
      }),
      capabilities,
    );
  }

  async getHealth(context?: AdapterRequestContext): Promise<AdapterHealth> {
    if (this.config.mode === 'mock') {
      return {
        adapterKey: 'odoo',
        status: 'healthy',
        authStatus: 'unknown',
        checkedAt: new Date().toISOString(),
        details: { mode: 'mock' },
      };
    }
    return this.basicHealthCheck(context, '/api/company', 'odoo.health');
  }

  async findCustomers(query: { search?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.findCustomers', async (correlationId) => {
      const response = await this.request<OdooPartnerRecord[]>('/api/customers', { search: query.search, limit: query.limit }, correlationId, context);
      return response.map((record) => mapOdooCustomerSummary(record, this.config.baseUrl));
    });
  }

  async getCustomerById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.getCustomerById', async (correlationId) => {
      const record = await this.request<OdooPartnerRecord>(`/api/customers/${id}`, undefined, correlationId, context);
      return mapOdooCustomerDetail(record, this.config.baseUrl);
    });
  }

  async createOrUpdateCustomer(payload: { id?: string; displayName: string; email?: string; phone?: string; companyName?: string }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.createOrUpdateCustomer', async (correlationId) => {
      const record = await this.httpClient.requestJson<OdooPartnerRecord>({
        path: payload.id ? `/api/customers/${payload.id}` : '/api/customers',
        method: payload.id ? 'PUT' : 'POST',
        operation: 'odoo.createOrUpdateCustomer',
        correlationId,
        retryable: false,
        headers: createTracingHeaders({ ...context, correlationId }),
        authHeaders: createOdooAuthHeaders(this.config),
        body: {
          name: payload.displayName,
          email: payload.email,
          phone: payload.phone,
          company_name: payload.companyName,
        },
      });
      return mapOdooCustomerDetail(record, this.config.baseUrl);
    });
  }

  async listInvoices(filters: { customerId?: string; status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.listInvoices', async (correlationId) => {
      const response = await this.request<OdooInvoiceRecord[]>('/api/invoices', { customerId: filters.customerId, status: filters.status, limit: filters.limit }, correlationId, context);
      return response.map((record) => mapOdooInvoiceSummary(record, this.config.baseUrl));
    });
  }

  async getInvoiceById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.getInvoiceById', async (correlationId) => {
      const record = await this.request<OdooInvoiceRecord>(`/api/invoices/${id}`, undefined, correlationId, context);
      return mapOdooInvoiceDetail(record, this.config.baseUrl);
    });
  }

  async listSupportTickets(filters: { customerId?: string; status?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.listSupportTickets', async (correlationId) => {
      const response = await this.request<OdooTicketRecord[]>('/api/support/tickets', { customerId: filters.customerId, status: filters.status, limit: filters.limit }, correlationId, context);
      return response.map((record) => mapOdooSupportTicketSummary(record, this.config.baseUrl));
    });
  }

  async getSupportTicketById(id: string, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.getSupportTicketById', async (correlationId) => {
      const record = await this.request<OdooTicketRecord>(`/api/support/tickets/${id}`, undefined, correlationId, context);
      return mapOdooSupportTicketDetail(record, this.config.baseUrl);
    });
  }

  async listKnowledgeItems(filters: { search?: string; limit?: number }, context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.listKnowledgeItems', async (correlationId) => {
      const response = await this.request<OdooKnowledgeRecord[]>('/api/knowledge', { search: filters.search, limit: filters.limit }, correlationId, context);
      return response.map((record) => mapOdooKnowledgeItem(record, this.config.baseUrl));
    });
  }

  async getCompanyContext(context?: AdapterRequestContext) {
    return this.withEnvelope(context, 'odoo.getCompanyContext', async (correlationId) => {
      const record = await this.request<OdooCompanyRecord>('/api/company', undefined, correlationId, context);
      return mapOdooCompanyContext(record, this.config.baseUrl);
    });
  }

  private async request<T>(path: string, query: Record<string, string | number | undefined> | undefined, correlationId: string, context?: AdapterRequestContext) {
    return this.httpClient.requestJson<T>({
      path,
      query,
      method: 'GET',
      operation: path,
      correlationId,
      retryable: true,
      headers: createTracingHeaders({ ...context, correlationId }),
      authHeaders: createOdooAuthHeaders(this.config),
    });
  }
}
