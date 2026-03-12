import type { ContentActionType, ContentTypeKey, Document, DocumentSuite, KnowledgeArticle, MembershipTier, PartnerOffer } from './definitions';
import type { ManagedServicePage } from './public-content';

export type ContentObjectType =
  | 'docshare_template'
  | 'docshare_companion_guide'
  | 'docshare_documentation_suite'
  | 'docshare_end_to_end_process'
  | 'docshare_tool'
  | 'docshare_resource'
  | 'partner_offer'
  | 'knowledge_center_article'
  | 'knowledge_center_guide'
  | 'knowledge_center_tool'
  | 'knowledge_center_knowledge_base'
  | 'service_page';

export type ContentObjectStatus = 'draft' | 'published' | 'archived';

export type AccessBehavior = {
  accessTier: MembershipTier;
  requiresLogin: boolean;
  requiresMembership: boolean;
  previewEnabled: boolean;
  previewContent?: string;
};

export type RelatedContentReference = {
  id: string;
  contentType: ContentObjectType;
  title?: string;
  path?: string;
};

export type RenderableContentObject = {
  id: string;
  sourceCollection: string;
  sourceId: string;
  contentType: ContentObjectType;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  category?: string;
  tags: string[];
  accessBehavior?: AccessBehavior;
  heroImageUrl?: string;
  relatedContent: RelatedContentReference[];
  actionType?: ContentActionType;
  actionLabel?: string;
  actionTarget?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: ContentObjectStatus;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  templateFields?: Partial<Record<
    | 'templateDetails'
    | 'whatsIncluded'
    | 'companionResources'
    | 'relatedTemplates'
    | 'implementationNotes'
    | 'implementationSteps'
    | 'guidePurpose'
    | 'guideSections'
    | 'relatedTemplatesSummary'
    | 'relatedResourcesSummary'
    | 'relatedResources'
    | 'suiteContentsSummary'
    | 'suiteContents'
    | 'documentStructure'
    | 'documentStructureItems'
    | 'implementationOrderSummary'
    | 'implementationOrder'
    | 'processOverview'
    | 'processStages'
    | 'rolesAndOwnershipSummary'
    | 'rolesAndOwnership'
    | 'includedAssetsSummary'
    | 'includedAssets'
    | 'toolOverview'
    | 'toolComponents'
    | 'howItWorks'
    | 'howItWorksSteps'
    | 'whenToUseSummary'
    | 'whenToUse'
    | 'offerDetails'
    | 'offerHighlights'
    | 'partnerOverview'
    | 'partnerServices'
    | 'claimInstructions'
    | 'claimChecklist'
    | 'termsAndConditions'
    | 'termsHighlights'
    | 'articleSummary'
    | 'keyTakeaways'
    | 'embeddedResourcesSummary'
    | 'embeddedResources'
    | 'guideSummary'
    | 'downloadableResourcesSummary'
    | 'downloadableResources'
    | 'exampleApplication'
    | 'exampleSteps'
    | 'serviceOverview'
    | 'problemsSolved'
    | 'serviceInclusionsSummary'
    | 'serviceInclusions'
    | 'membershipDiscountMessage'
    | 'discountHighlights'
    | 'discoveryCallBooking'
    | 'bookingSteps'
    | 'resourceOverview'
    | 'resourceHighlights',
    string | string[]
  >>;
};

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ensureUniqueSlug(base: string, existing: string[]): string {
  const root = normalizeSlug(base) || 'item';
  const set = new Set(existing.map((s) => normalizeSlug(s)));
  if (!set.has(root)) return root;
  let i = 2;
  while (set.has(`${root}-${i}`)) i += 1;
  return `${root}-${i}`;
}

export function getDocushareSegment(type?: DocumentSuite['contentType']): string {
  switch (type) {
    case 'templates':
      return 'templates';
    case 'companion-guides':
      return 'companion-guides';
    case 'documentation-suites':
      return 'documentation-suites';
    case 'end-to-end-processes':
      return 'end-to-end-processes';
    case 'customisation-service':
      return 'tools';
    default:
      return 'templates';
  }
}

export function getContentObjectPath(contentType: ContentObjectType, slug: string, categorySegment?: string): string {
  switch (contentType) {
    case 'partner_offer':
      return `/partner-offers/${slug}`;
    case 'knowledge_center_article':
      return `/knowledge-center/articles/${slug}`;
    case 'knowledge_center_guide':
      return `/knowledge-center/guides/${slug}`;
    case 'knowledge_center_tool':
      return `/knowledge-center/tools/${slug}`;
    case 'knowledge_center_knowledge_base':
      return `/knowledge-center/knowledge/${slug}`;
    case 'service_page':
      return `/services/${slug}`;
    case 'docshare_resource':
      return `/docushare/resources/${slug}`;
    default:
      return `/docushare/${categorySegment ?? 'templates'}/${slug}`;
  }
}

function getDocushareTypeFromSuite(type?: DocumentSuite['contentType']): ContentObjectType {
  switch (type) {
    case 'companion-guides':
      return 'docshare_companion_guide';
    case 'documentation-suites':
      return 'docshare_documentation_suite';
    case 'end-to-end-processes':
      return 'docshare_end_to_end_process';
    case 'customisation-service':
      return 'docshare_tool';
    case 'templates':
    default:
      return 'docshare_template';
  }
}

export function toRenderableDocushareSuite(suite: DocumentSuite): RenderableContentObject {
  const contentType = getDocushareTypeFromSuite(suite.contentType);
  const segment = getDocushareSegment(suite.contentType);
  const slug = suite.slug ?? normalizeSlug(suite.name);
  return {
    id: suite.id,
    sourceCollection: 'documentation_suites',
    sourceId: suite.id,
    contentType,
    title: suite.name,
    slug,
    summary: suite.summary,
    description: suite.description,
    category: suite.category,
    tags: suite.tags ?? [],
    accessBehavior: suite.entitlement
      ? {
          accessTier: suite.entitlement.accessTier,
          requiresLogin: suite.entitlement.requiresLogin,
          requiresMembership: suite.entitlement.requiresMembership,
          previewEnabled: suite.entitlement.previewEnabled,
          previewContent: suite.previewContent,
        }
      : undefined,
    heroImageUrl: suite.heroImageUrl,
    relatedContent: (suite.relatedContent ?? []).map((item) => ({
      id: item.id,
      contentType: item.contentType.startsWith('knowledge_center') ? (item.contentType as ContentObjectType) : 'docshare_template',
      title: item.label,
      path: item.path,
    })),
    actionType: suite.actionType,
    actionLabel: suite.actionLabel,
    actionTarget: suite.actionTarget ?? getContentObjectPath(contentType, slug, segment),
    seoTitle: suite.seoTitle,
    seoDescription: suite.seoDescription,
    status: suite.status ?? 'published',
    featured: suite.featured,
    createdAt: suite.createdAt,
    updatedAt: suite.updatedAt,
    publishedAt: suite.publishedAt,
    templateFields: {
      templateDetails: suite.templateDetails,
      whatsIncluded: suite.whatsIncluded,
      companionResources: suite.companionResources,
      relatedTemplates: suite.relatedTemplates,
      implementationNotes: suite.implementationNotes,
      implementationSteps: suite.implementationSteps,
      guidePurpose: suite.guidePurpose,
      guideSections: suite.guideSections,
      relatedTemplatesSummary: suite.relatedTemplatesSummary,
      relatedResourcesSummary: suite.relatedResourcesSummary,
      relatedResources: suite.relatedResources,
      suiteContentsSummary: suite.suiteContentsSummary,
      suiteContents: suite.suiteContents,
      documentStructure: suite.documentStructure,
      documentStructureItems: suite.documentStructureItems,
      implementationOrderSummary: suite.implementationOrderSummary,
      implementationOrder: suite.implementationOrder,
      processOverview: suite.processOverview,
      processStages: suite.processStages,
      rolesAndOwnershipSummary: suite.rolesAndOwnershipSummary,
      rolesAndOwnership: suite.rolesAndOwnership,
      includedAssetsSummary: suite.includedAssetsSummary,
      includedAssets: suite.includedAssets,
      toolOverview: suite.toolOverview,
      toolComponents: suite.toolComponents,
      howItWorks: suite.howItWorks,
      howItWorksSteps: suite.howItWorksSteps,
      whenToUseSummary: suite.whenToUseSummary,
      whenToUse: suite.whenToUse,
    },
  };
}

export function toRenderableDocument(document: Document, suite?: DocumentSuite): RenderableContentObject {
  const slug = document.slug ?? normalizeSlug(document.name);
  return {
    id: document.id,
    sourceCollection: 'documentation_suites.documents',
    sourceId: document.id,
    contentType: 'docshare_resource',
    title: document.name,
    slug,
    summary: document.summary,
    description: document.description,
    category: document.category,
    tags: document.tags ?? [],
    accessBehavior: suite?.entitlement
      ? {
          accessTier: suite.entitlement.accessTier,
          requiresLogin: suite.entitlement.requiresLogin,
          requiresMembership: suite.entitlement.requiresMembership,
          previewEnabled: suite.entitlement.previewEnabled,
          previewContent: document.previewContent,
        }
      : undefined,
    heroImageUrl: undefined,
    relatedContent: [],
    actionType: document.actionType ?? 'download',
    actionLabel: document.actionLabel ?? 'Access resource',
    actionTarget: document.actionTarget ?? document.url,
    seoTitle: document.seoTitle,
    seoDescription: document.seoDescription,
    status: document.status ?? 'published',
    createdAt: document.createdAt,
    updatedAt: document.createdAt,
    templateFields: {
      resourceOverview: document.summary ?? document.description,
      resourceHighlights: document.tags,
    },
  };
}

export function toRenderablePartnerOffer(offer: PartnerOffer): RenderableContentObject {
  const slug = offer.slug ?? normalizeSlug(offer.title);
  return {
    id: offer.id,
    sourceCollection: 'partner_offers',
    sourceId: offer.id,
    contentType: 'partner_offer',
    title: offer.title,
    slug,
    summary: offer.summary,
    description: offer.offerDetails ?? offer.description,
    category: offer.categories?.[0],
    tags: offer.categories ?? [],
    accessBehavior: offer.entitlement
      ? {
          accessTier: offer.entitlement.accessTier,
          requiresLogin: offer.entitlement.requiresLogin,
          requiresMembership: offer.entitlement.requiresMembership,
          previewEnabled: offer.entitlement.previewEnabled,
        }
      : undefined,
    heroImageUrl: offer.imageUrl,
    relatedContent: (offer.relatedOfferIds ?? []).map((id) => ({ id, contentType: 'partner_offer' })),
    actionType: offer.actionType ?? 'redeem',
    actionLabel: offer.actionLabel ?? 'Claim offer',
    actionTarget: offer.actionTarget ?? offer.link,
    seoTitle: offer.seoTitle,
    seoDescription: offer.seoDescription,
    status: offer.active ? 'published' : 'draft',
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    publishedAt: offer.publishedAt,
    templateFields: {
      offerDetails: offer.offerDetails ?? offer.description,
      offerHighlights: [offer.offerValue, offer.expiresAt ? `Valid until ${offer.expiresAt}` : undefined].filter(Boolean) as string[],
      partnerOverview: offer.partnerOverview,
      partnerServices: offer.partnerServices,
      claimInstructions: offer.claimInstructions,
      claimChecklist: [offer.redemptionCode ? `Activation code: ${offer.redemptionCode}` : undefined].filter(Boolean) as string[],
      termsAndConditions: offer.termsAndConditions,
      termsHighlights: offer.categories,
    },
  };
}

export function toRenderableKnowledgeArticle(article: KnowledgeArticle): RenderableContentObject {
  const contentType: ContentObjectType = article.contentType === 'guide'
    ? 'knowledge_center_guide'
    : article.contentType === 'tool'
      ? 'knowledge_center_tool'
      : article.contentType === 'knowledge_base'
        ? 'knowledge_center_knowledge_base'
        : 'knowledge_center_article';

  return {
    id: article.id,
    sourceCollection: 'knowledge_articles',
    sourceId: article.id,
    contentType,
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? article.excerpt,
    description: article.content,
    category: article.category,
    tags: article.tags ?? [],
    accessBehavior: article.entitlement
      ? {
          accessTier: article.entitlement.accessTier,
          requiresLogin: article.entitlement.requiresLogin,
          requiresMembership: article.entitlement.requiresMembership,
          previewEnabled: article.entitlement.previewEnabled,
        }
      : undefined,
    heroImageUrl: article.imageUrl,
    relatedContent: (article.relatedContent ?? []).map((item) => ({
      id: item.id,
      contentType: item.contentType.startsWith('knowledge_center') ? (item.contentType as ContentObjectType) : 'knowledge_center_article',
      title: item.label,
      path: item.path,
    })),
    actionType: article.ctaType,
    actionLabel: article.ctaLabel,
    actionTarget: article.externalLink,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    status: article.published ? 'published' : 'draft',
    featured: article.featured,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    templateFields: {
      articleSummary: article.summary ?? article.excerpt,
      keyTakeaways: article.keyTakeaways,
      embeddedResourcesSummary: article.embeddedResourcesSummary,
      embeddedResources: article.embeddedResources,
      guideSummary: article.summary,
      guideSections: article.guideSections,
      downloadableResourcesSummary: article.downloadableResourcesSummary,
      downloadableResources: article.downloadableResources,
      toolOverview: article.summary,
      toolComponents: article.toolComponents,
      howItWorks: article.howItWorks,
      howItWorksSteps: article.howItWorksSteps,
      exampleApplication: article.exampleApplication,
      exampleSteps: article.exampleSteps,
      relatedResourcesSummary: article.relatedResourcesSummary,
      relatedResources: article.relatedResources,
    },
  };
}

export function toRenderableServicePage(service: ManagedServicePage): RenderableContentObject {
  return {
    id: service.id,
    sourceCollection: 'service_pages',
    sourceId: service.id,
    contentType: 'service_page',
    title: service.title,
    slug: service.slug,
    summary: service.shortDescription,
    description: service.shortDescription,
    tags: [],
    accessBehavior: service.entitlement
      ? {
          accessTier: service.entitlement.accessTier,
          requiresLogin: service.entitlement.requiresLogin,
          requiresMembership: service.entitlement.requiresMembership,
          previewEnabled: service.entitlement.previewEnabled,
        }
      : undefined,
    heroImageUrl: service.heroImageUrl,
    relatedContent: [],
    actionType: 'book_call',
    actionLabel: service.ctaLabel,
    actionTarget: service.ctaHref,
    status: service.published ? 'published' : 'draft',
    templateFields: {
      serviceOverview: service.overview ?? service.shortDescription,
      problemsSolved: service.problemsSolved,
      serviceInclusionsSummary: service.inclusionsSummary,
      serviceInclusions: service.serviceInclusions,
      membershipDiscountMessage: service.membershipDiscountMessage,
      discountHighlights: service.benefits?.map((item) => item.title),
      discoveryCallBooking: service.discoveryCallBooking,
      bookingSteps: [service.ctaHref ? 'Use the discovery call CTA to start.' : undefined].filter(Boolean) as string[],
    },
  };
}
