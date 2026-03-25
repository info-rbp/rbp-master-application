export type OdooPartnerRecord = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  active?: boolean;
  street?: string;
  street2?: string;
  comment?: string;
  category_tags?: string[];
};

export type OdooInvoiceRecord = {
  id: number;
  name: string;
  partner_id?: [number, string];
  currency_id?: [number, string];
  amount_total?: number;
  amount_residual?: number;
  state?: string;
  invoice_date?: string;
  invoice_date_due?: string;
  invoice_line_items?: Array<{ name?: string; quantity?: number; price_unit?: number; price_total?: number }>;
};

export type OdooTicketRecord = {
  id: number;
  ticket_ref?: string;
  name: string;
  stage_name?: string;
  priority?: string;
  partner_id?: [number, string];
  description?: string;
  user_id?: [number, string];
  create_date?: string;
  write_date?: string;
};

export type OdooKnowledgeRecord = {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  state?: string;
};

export type OdooCompanyRecord = {
  id: number;
  name: string;
  currency?: string;
  country?: string;
};
