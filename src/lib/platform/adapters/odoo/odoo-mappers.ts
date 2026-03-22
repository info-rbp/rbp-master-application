import type { CompanyContext, CustomerDetail, CustomerSummary, InvoiceDetail, InvoiceSummary, KnowledgeItemSummary, SourceReference, SupportTicketDetail, SupportTicketSummary } from '../../integrations/types';
import type { OdooCompanyRecord, OdooInvoiceRecord, OdooKnowledgeRecord, OdooPartnerRecord, OdooTicketRecord } from './odoo-types';

function sourceRef(type: string, id: string | number, baseUrl?: string): SourceReference {
  return {
    sourceSystem: 'odoo',
    sourceRecordType: type,
    sourceRecordId: String(id),
    sourceUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/web#id=${id}&model=${type}` : undefined,
    syncedAt: new Date().toISOString(),
  };
}

export function mapOdooCustomerSummary(record: OdooPartnerRecord, baseUrl?: string): CustomerSummary {
  return {
    id: String(record.id),
    displayName: record.name,
    email: record.email,
    phone: record.phone,
    companyName: record.company_name,
    status: record.active === false ? 'inactive' : 'active',
    sourceRef: sourceRef('res.partner', record.id, baseUrl),
  };
}

export function mapOdooCustomerDetail(record: OdooPartnerRecord, baseUrl?: string): CustomerDetail {
  return {
    ...mapOdooCustomerSummary(record, baseUrl),
    billingAddress: [record.street, record.street2].filter(Boolean).join(', ') || undefined,
    shippingAddress: [record.street, record.street2].filter(Boolean).join(', ') || undefined,
    tags: record.category_tags ?? [],
  };
}

export function mapOdooInvoiceSummary(record: OdooInvoiceRecord, baseUrl?: string): InvoiceSummary {
  return {
    id: String(record.id),
    invoiceNumber: record.name,
    customerId: record.partner_id ? String(record.partner_id[0]) : undefined,
    customerName: record.partner_id?.[1],
    currency: record.currency_id?.[1] ?? 'USD',
    amountTotal: record.amount_total ?? 0,
    amountDue: record.amount_residual ?? 0,
    status: record.state ?? 'unknown',
    issuedAt: record.invoice_date,
    dueAt: record.invoice_date_due,
    sourceRef: sourceRef('account.move', record.id, baseUrl),
  };
}

export function mapOdooInvoiceDetail(record: OdooInvoiceRecord, baseUrl?: string): InvoiceDetail {
  return {
    ...mapOdooInvoiceSummary(record, baseUrl),
    lines: (record.invoice_line_items ?? []).map((line) => ({
      description: line.name ?? 'Line item',
      quantity: line.quantity ?? 1,
      unitPrice: line.price_unit ?? 0,
      total: line.price_total ?? 0,
    })),
  };
}

export function mapOdooSupportTicketSummary(record: OdooTicketRecord, baseUrl?: string): SupportTicketSummary {
  return {
    id: String(record.id),
    ticketNumber: record.ticket_ref ?? `TICKET-${record.id}`,
    subject: record.name,
    status: record.stage_name ?? 'unknown',
    priority: record.priority,
    customerId: record.partner_id ? String(record.partner_id[0]) : undefined,
    createdAt: record.create_date,
    updatedAt: record.write_date,
    sourceRef: sourceRef('helpdesk.ticket', record.id, baseUrl),
  };
}

export function mapOdooSupportTicketDetail(record: OdooTicketRecord, baseUrl?: string): SupportTicketDetail {
  return {
    ...mapOdooSupportTicketSummary(record, baseUrl),
    description: record.description,
    assigneeName: record.user_id?.[1],
  };
}

export function mapOdooKnowledgeItem(record: OdooKnowledgeRecord, baseUrl?: string): KnowledgeItemSummary {
  return {
    id: String(record.id),
    title: record.title,
    slug: record.slug,
    summary: record.summary,
    status: record.state ?? 'published',
    sourceRef: sourceRef('knowledge.article', record.id, baseUrl),
  };
}

export function mapOdooCompanyContext(record: OdooCompanyRecord, baseUrl?: string): CompanyContext {
  return {
    companyId: String(record.id),
    companyName: record.name,
    currency: record.currency,
    country: record.country,
    sourceRef: sourceRef('res.company', record.id, baseUrl),
  };
}
