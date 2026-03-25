export type LendingApplicationRecord = {
  id: string;
  applicant_name: string;
  applicant_id?: string;
  status: string;
  product_name?: string;
  requested_amount?: number;
  currency?: string;
  stage?: string;
  submitted_at?: string;
};

export type LendingLoanRecord = {
  id: string;
  borrower_name: string;
  borrower_id?: string;
  status: string;
  principal_amount?: number;
  outstanding_amount?: number;
  currency?: string;
  servicing_state?: string;
  next_payment_due_at?: string;
};

export type LendingBorrowerRecord = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
};

export type LendingRequirementRecord = {
  id: string;
  label: string;
  status: string;
  required?: boolean;
};

export type LendingDocumentRecord = {
  id: string;
  file_name: string;
  status: string;
  uploaded_at?: string;
};
