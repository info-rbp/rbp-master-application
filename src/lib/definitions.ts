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
  squareSubscriptionPlanVariationId?: string | null;
  squareSubscriptionPlanId?: string | null;
  squareLocationId?: string | null;
  squareCatalogObjectVersion?: number | null;
};

export type Subscription = {
  id: string;
  userId: string;
  membershipPlanId: string;
  squareSubscriptionId: string;
  squareCustomerId?: string | null;
  squareLocationId?: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'pending' | 'paused';
  startDate: string;
  currentBillingAnchorDate?: string | null;
  chargedThroughDate?: string | null;
  canceledDate?: string | null;
  cardId?: string | null;
  sourceType: 'square_webhook' | 'admin' | 'system';
  createdAt: string;
  updatedAt: string;
  lastPaymentAt?: string | null;
  lastPaymentStatus?: 'paid' | 'failed' | 'pending' | null;
};

export type BillingEvent = {
  id: string;
  eventType: string;
  squareSubscriptionId?: string | null;
  userId?: string | null;
  planId?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  type: 'article' | 'guide' | 'tool' | 'knowledge_base';
  tags?: string[];
  authorId?: string;
  authorName?: string;
  published: boolean;
  featured?: boolean;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  externalLink?: string;
  ctaLabel?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
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
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  recipient: string;
  subject: string;
  templateKey: string;
  provider: string;
  triggerSource: string;
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sentAt?: string | null;
  errorMessage?: string | null;
};

export type AnalyticsEventRecord = {
  id: string;
  eventType: string;
  userId?: string;
  userRole?: string;
  targetId?: string;
  targetType?: string;
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


export type MemberCRMRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipTier: string;
  membershipStatus: string;
  joinDate: string;
  accessExpiry?: string | null;
  lastLogin?: string | null;
  overrideEnabled: boolean;
};

export type MemberDetail = MemberCRMRow & {
  phone?: string | null;
  company?: string | null;
  subscriptionPlanId?: string | null;
  squareSubscriptionId?: string | null;
  squareCustomerId?: string | null;
  lastPaymentStatus?: string | null;
  lastPaymentAt?: string | null;
};

export type MemberOverride = {
  id: string;
  memberId: string;
  enabled: boolean;
  reason: string;
  startDate: string;
  endDate?: string | null;
  changedBy: string;
  changedAt: string;
};

export type MemberNote = {
  id: string;
  memberId: string;
  authorUserId: string;
  authorName?: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type MembershipHistoryItem = {
  id: string;
  memberId: string;
  oldTier?: string | null;
  newTier?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  changedBy: string;
  changedAt: string;
};

export type MemberCRMMetricSummary = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  lapsedMembers: number;
  suspendedMembers: number;
  membersOnOverride: number;
  recentSignups: number;
  recentStatusChanges: number;
};
