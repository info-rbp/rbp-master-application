import type { CommercialCustomerDetailDto, CommercialCustomerSummaryDto, CommercialEntitlementBridgeDto, CommercialInvoiceDetailDto, CommercialInvoiceSummaryDto } from '@/lib/bff/dto/commercial';
import { requirePermission, type BffRequestContext, BffApiError } from '@/lib/bff/utils/request-context';
import { getPlatformAdapter } from '@/lib/platform/adapters/factory';

function adapterContext(context: BffRequestContext) {
  return { correlationId: context.correlationId, tenantId: context.session.activeTenant.id };
}

export class CommercialBffService {
  async listCustomers(query: { search?: string; limit?: number }, context: BffRequestContext): Promise<CommercialCustomerSummaryDto[]> {
    requirePermission(context, 'customer', 'read');
    const odoo = getPlatformAdapter('odoo');
    const envelope = await odoo.findCustomers({ search: query.search, limit: query.limit ?? 50 }, adapterContext(context));
    return envelope.data.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      email: c.email,
      phone: c.phone,
      companyName: c.companyName,
      status: c.status,
    }));
  }

  async getCustomerDetail(id: string, context: BffRequestContext): Promise<CommercialCustomerDetailDto> {
    requirePermission(context, 'customer', 'read');
    const odoo = getPlatformAdapter('odoo');
    const ctx = adapterContext(context);

    const customerEnv = await odoo.getCustomerById(id, ctx).catch(() => null);
    if (!customerEnv) throw new BffApiError('not_found', 'Customer not found.', 404);
    const customer = customerEnv.data;

    const [invoiceEnv, ticketEnv] = await Promise.all([
      odoo.listInvoices({ customerId: id, limit: 100 }, ctx).catch(() => null),
      odoo.listSupportTickets({ customerId: id, limit: 100 }, ctx).catch(() => null),
    ]);

    const invoices = invoiceEnv?.data ?? [];
    const tickets = ticketEnv?.data ?? [];

    return {
      id: customer.id,
      displayName: customer.displayName,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName,
      status: customer.status,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      tags: customer.tags ?? [],
      invoiceSummary: invoices.length > 0
        ? {
            totalInvoices: invoices.length,
            totalOutstanding: invoices.reduce((sum, inv) => sum + inv.amountDue, 0),
            currency: invoices[0].currency ?? 'USD',
          }
        : undefined,
      supportSummary: tickets.length > 0
        ? {
            openTickets: tickets.filter((t) => t.status === 'open' || t.status === 'new').length,
            totalTickets: tickets.length,
          }
        : undefined,
    };
  }

  async listInvoices(filters: { customerId?: string; status?: string; limit?: number }, context: BffRequestContext): Promise<CommercialInvoiceSummaryDto[]> {
    requirePermission(context, 'finance', 'read');
    const odoo = getPlatformAdapter('odoo');
    const envelope = await odoo.listInvoices({ customerId: filters.customerId, status: filters.status, limit: filters.limit ?? 50 }, adapterContext(context));
    return envelope.data.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      currency: inv.currency,
      amountTotal: inv.amountTotal,
      amountDue: inv.amountDue,
      status: inv.status,
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
    }));
  }

  async getInvoiceDetail(id: string, context: BffRequestContext): Promise<CommercialInvoiceDetailDto> {
    requirePermission(context, 'finance', 'read');
    const odoo = getPlatformAdapter('odoo');
    const envelope = await odoo.getInvoiceById(id, adapterContext(context)).catch(() => null);
    if (!envelope) throw new BffApiError('not_found', 'Invoice not found.', 404);
    const inv = envelope.data;
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      currency: inv.currency,
      amountTotal: inv.amountTotal,
      amountDue: inv.amountDue,
      status: inv.status,
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      lines: inv.lines ?? [],
    };
  }

  async getEntitlementBridge(tenantId: string, context: BffRequestContext): Promise<CommercialEntitlementBridgeDto> {
    const odoo = getPlatformAdapter('odoo');
    const ctx = adapterContext(context);
    const invoiceEnv = await odoo.listInvoices({ limit: 20 }, ctx).catch(() => null);
    const invoices = invoiceEnv?.data ?? [];
    const outstandingBalance = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const lastInvoice = invoices[0];
    const accessRestrictions: string[] = [];
    if (outstandingBalance > 0 && invoices.some((inv) => inv.status === 'overdue')) {
      accessRestrictions.push('overdue_invoices');
    }

    return {
      tenantId,
      hasActiveSubscription: true,
      outstandingBalance,
      currency: lastInvoice?.currency ?? 'USD',
      lastInvoiceStatus: lastInvoice?.status,
      accessRestrictions,
    };
  }
}
