export type Document = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: 'file' | 'drive';
  createdAt: string;
  suiteId: string;
};

export type DocumentSuite = {
  id: string;
  name: string;
  description: string;
  documents: Document[];
};

export type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  currency: string;
  amount: number;
  interval: string;
  active: boolean;
  stripePriceId?: string;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'unpaid' | 'trialing';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerOffer = {
  id: string;
  title: string;
  description: string;
  link: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Testimonial = {
  id: string;
  clientName: string;
  content: string;
  role?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
};

export type PastProject = {
  id: string;
  name: string;
  description: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  role: string;
  membershipTier?: string | null;
  membershipStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type Entitlement = {
  id: string;
  userId: string;
  feature: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailLog = {
  id: string;
  status: 'sent' | 'failed' | 'skipped';
  recipient: string;
  subject: string;
  templateKey: string;
  sentAt: string;
  error?: string;
};

export type AnalyticsEventRecord = {
  id: string;
  eventType: string;
  userId?: string;
  role?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sessionId?: string;
};

export type AuditLogRecord = {
  id: string;
  actorUserId: string;
  actorRole: string;
  actionType: string;
  targetId?: string;
  targetType?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
