export const MEMBERSHIP_TIERS = ['basic', 'standard', 'premium'] as const;
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];

export const BILLING_CYCLES = ['free', 'monthly', 'annual'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const MEMBERSHIP_PLAN_CODES = [
  'basic_free',
  'standard_monthly',
  'standard_annual',
  'premium_monthly',
  'premium_annual',
] as const;
export type MembershipPlanCode = (typeof MEMBERSHIP_PLAN_CODES)[number];

export type MembershipStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'pending' | 'paused' | 'suspended' | 'lapsed';

export type ToolsAccessLevel = 'none' | 'limited' | 'full';

export type ContentTypeKey =
  | 'docshare_template'
  | 'docshare_companion_guide'
  | 'docshare_documentation_suite'
  | 'docshare_end_to_end_process'
  | 'docshare_tool'
  | 'partner_offer_top'
  | 'partner_offer_exclusive'
  | 'knowledge_center_article'
  | 'service_discovery_call'
  | 'service_strategic_checkup'
  | 'implementation_support';

export type EntitlementAccessFields = {
  accessTier: MembershipTier;
  requiresLogin: boolean;
  requiresMembership: boolean;
  previewEnabled: boolean;
  isLimitedAccess: boolean;
  contentType: ContentTypeKey;
};

export type Tool = {
    toolKey: string;
    name: string;
    enabled: boolean;
    baseUrl: string;
    requiredTier: MembershipTier;
    launchMode: "jwt" | "direct";
    hostingMode: "cloudflare_worker" | "cloudflare_container" | "self_hosted";
    supportsProvisioning: boolean;
    supportsTenanting: boolean;
    googleBrokerFeatures: string[];
}

export type ToolAccount = {
    userId: string;
    toolKey: string;
    tenantId: string;
    externalUserId: string;
    externalWorkspaceId: string;
    role: "member" | "admin";
    status: "active" | "suspended";
    lastProvisionedAt: string;
}

export type Document = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: 'file' | 'drive';
  createdAt: string;
  suiteId: string;
  slug?: string;
  summary?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  previewContent?: string;
  actionType?: ContentActionType;
  actionLabel?: string;
  actionTarget?: string;
  relatedContent?: RelatedContentReference[];
};

export type DocumentSuite = {
  id: string;
  name: string;
  description: string;
  contentType?: 'templates' | 'companion-guides' | 'documentation-suites' | 'end-to-end-processes' | 'customisation-service';
  entitlement?: EntitlementAccessFields;
  documents: Document[];
  slug?: string;
  summary?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  heroImageUrl?: string;
  previewContent?: string;
  seoTitle?: string;
  seoDescription?: string;
  actionType?: ContentActionType;
  actionLabel?: string;
  actionTarget?: string;
  relatedContent?: RelatedContentReference[];
  templateDetails?: string;
  whatsIncluded?: string[];
  companionResources?: string;
  relatedTemplates?: string[];
  implementationNotes?: string;
  implementationSteps?: string[];
  guidePurpose?: string;
  guideSections?: string[];
  relatedTemplatesSummary?: string;
  relatedResourcesSummary?: string;
  relatedResources?: string[];
  suiteContentsSummary?: string;
  suiteContents?: string[];
  documentStructure?: string;
  documentStructureItems?: string[];
  implementationOrderSummary?: string;
  implementationOrder?: string[];
  processOverview?: string;
  processStages?: string[];
  rolesAndOwnershipSummary?: string;
  rolesAndOwnership?: string[];
  includedAssetsSummary?: string;
  includedAssets?: string[];
  toolOverview?: string;
  toolComponents?: string[];
  howItWorks?: string;
  howItWorksSteps?: string[];
  whenToUseSummary?: string;
  whenToUse?: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContentActionType = 'download' | 'access' | 'launch' | 'redeem' | 'book_call' | 'join' | 'upgrade' | 'external_link';

export type RelatedContentReference = {
  id: string;
  contentType: ContentTypeKey | 'knowledge_center_guide' | 'knowledge_center_tool' | 'knowledge_center_knowledge_base' | 'service_page' | 'partner_offer';
  label?: string;
  path?: string;
};

export type MembershipPlan = {
  id: string;
  code: MembershipPlanCode;
  tier: MembershipTier;
  billingCycle: BillingCycle;
  name: string;
  description: string;
  currency: string;
  amount: number;
  interval: BillingCycle;
  active: boolean;
  promotionEligible?: boolean;
  squareSubscriptionPlanVariationId?: string | null;
  squareSubscriptionPlanId?: string | null;
  squareLocationId?: string | null;
  squareCatalogObjectVersion?: number | null;
};

export type Subscription = {
  id: string;
  userId: string;
  membershipPlanCode: MembershipPlanCode;
  membershipTier: MembershipTier;
  billingCycle: BillingCycle;
  membershipPlanId: string;
  squareSubscriptionId: string;
  squareCustomerId?: string | null;
  squareLocationId?: string | null;
  status: MembershipStatus;
  startDate: string;
  endDate?: string | null;
  renewalDate?: string | null;
  currentBillingAnchorDate?: string | null;
  chargedThroughDate?: string | null;
  canceledDate?: string | null;
  cardId?: string | null;
  sourceType: 'square_webhook' | 'admin' | 'system';
  createdAt: string;
  updatedAt: string;
  lastPaymentAt?: string | null;
  lastPaymentStatus?: 'paid' | 'failed' | 'pending' | null;
  promotionSourceType?: string | null;
  promotionSourceReferenceId?: string | null;
};

export type MembershipAccessGrant = {
  id: string;
  userId: string;
  sourceType: 'service_purchase' | 'admin_grant' | 'discount_code' | 'seasonal_offer' | 'referral_offer' | 'bundle_offer' | 'limited_time_unlock' | 'system';
  sourceReferenceId: string;
  grantTier: MembershipTier;
  grantStartAt: string;
  grantEndAt: string;
  status: 'active' | 'scheduled' | 'expired' | 'revoked';
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  category?: string;
  contentType?: 'article' | 'guide' | 'tool' | 'knowledge_base';
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
  ctaType?: ContentActionType;
  summary?: string;
  keyTakeaways?: string[];
  guideSections?: string[];
  downloadableResources?: string[];
  downloadableResourcesSummary?: string;
  toolComponents?: string[];
  howItWorks?: string;
  howItWorksSteps?: string[];
  whenToUse?: string[];
  exampleApplication?: string;
  exampleSteps?: string[];
  embeddedResources?: string[];
  embeddedResourcesSummary?: string;
  relatedResources?: string[];
  relatedResourcesSummary?: string;
  relatedContent?: RelatedContentReference[];
  entitlement?: EntitlementAccessFields;
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
  slug?: string;
  summary?: string;
  partnerName?: string;
  partnerOverview?: string;
  partnerServices?: string[];
  whyWeRecommend?: string;
  offerValue?: string;
  offerDetails?: string;
  claimInstructions?: string;
  termsAndConditions?: string;
  redemptionCode?: string;
  seoTitle?: string;
  seoDescription?: string;
  categories?: string[];
  imageUrl?: string;
  displayOrder?: number;
  expiresAt?: string | null;
  relatedOfferIds?: string[];
  actionType?: ContentActionType;
  actionLabel?: string;
  actionTarget?: string;
  publishedAt?: string;
  entitlement?: EntitlementAccessFields;
  createdAt: string;
  updatedAt: string;
};

export type Testimonial = {
  id: string;
  clientName: string;
  content: string;
  role?: string;
  company?: string;
  active: boolean;
  imageUrl?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type PastProject = {
  id: string;
  name: string;
  description: string;
  link?: string;
  active: boolean;
  imageUrl?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  role: string;
  membershipTier?: MembershipTier | null;
  membershipStatus?: MembershipStatus;
  membershipPlanCode?: MembershipPlanCode | null;
  billingCycle?: BillingCycle | null;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  accountStatus?: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  accessExpiry?: string | null;
  squareCustomerId?: string | null;
  squareSubscriptionId?: string | null;
  lastPaymentStatus?: string | null;
  lastPaymentAt?: string | null;
  activePromotionGrantEndAt?: string | null;
  activePromotionGrantTier?: MembershipTier | null;
};

export type UserAdminListFilters = {
  query?: string;
  role?: string;
  membershipStatus?: string;
  membershipTier?: string;
  verification?: 'all' | 'verified' | 'unverified';
  accountStatus?: 'all' | 'active' | 'suspended';
  sortBy?: 'createdAt' | 'lastLoginAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type UserAdminListResult = {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UserAdminNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type UserAdminActivity = {
  analyticsEvents: AnalyticsEventRecord[];
  auditEvents: AuditLogRecord[];
  membershipHistory: MembershipHistoryItem[];
  notifications: UserAdminNotification[];
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
  emailVerified?: boolean;
  overrideEnabled: boolean;
  squareSubscriptionStatus?: string | null;
  squareSubscriptionId?: string | null;
  squareCustomerId?: string | null;
  membershipPlanCode?: MembershipPlanCode | null;
  billingCycle?: BillingCycle | null;
  activePromotionGrantEndAt?: string | null;
};

export type MemberDetail = MemberCRMRow & {
  phone?: string | null;
  company?: string | null;
  subscriptionPlanId?: string | null;
  lastPaymentStatus?: string | null;
  lastPaymentAt?: string | null;
  squareLocationId?: string | null;
  membershipPlanCode?: MembershipPlanCode | null;
  billingCycle?: BillingCycle | null;
  activePromotionGrantEndAt?: string | null;
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
  source?: 'admin' | 'manual' | 'provider_sync' | 'system';
};

export type MemberListResult = {
  items: MemberCRMRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MemberCRMOverview = {
  metrics: MemberCRMMetricSummary;
  members: MemberListResult;
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


export type SitePageSectionItem = {
  title: string;
  description?: string;
  href?: string;
  imageUrl?: string;
  order?: number;
};

export type SitePageSection = {
  id: string;
  title: string;
  description?: string;
  items?: SitePageSectionItem[];
};

export type SitePageContent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  heroImageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sections?: SitePageSection[];
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  publishedAt?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type LifecycleEventType =
    | "user.created"
    | "user.account_status_changed"
    | "membership.tier_changed"
    | "membership.status_changed"
    | "tool.account_provisioned"
    | "tool.account_suspended"
    | "tool.account_unsuspended"
    | "tool.account_deleted";

export type LifecycleEvent<T = Record<string, unknown>> = {
    id: string;
    type: LifecycleEventType;
    userId: string;
    processedAt?: string;
    data: T;
};

export type ToolLifecycleEvent = LifecycleEvent<{
    toolKey: string;
    [key: string]: any;
}>;
