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
