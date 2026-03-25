/**
 * Platform-owned DTOs for commercial surfaces.
 * No raw Odoo schema leaks into these types.
 */

export type CommercialCustomerSummaryDto = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
};

export type CommercialCustomerDetailDto = CommercialCustomerSummaryDto & {
  billingAddress?: string;
  shippingAddress?: string;
  tags: string[];
  invoiceSummary?: {
    totalInvoices: number;
    totalOutstanding: number;
    currency: string;
  };
  supportSummary?: {
    openTickets: number;
    totalTickets: number;
  };
};

export type CommercialInvoiceSummaryDto = {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  currency: string;
  amountTotal: number;
  amountDue: number;
  status: string;
  issuedAt?: string;
  dueAt?: string;
};

export type CommercialInvoiceDetailDto = CommercialInvoiceSummaryDto & {
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type CommercialEntitlementBridgeDto = {
  tenantId: string;
  hasActiveSubscription: boolean;
  subscriptionTier?: string;
  outstandingBalance: number;
  currency: string;
  lastInvoiceStatus?: string;
  accessRestrictions: string[];
};
