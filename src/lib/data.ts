import { firestore } from '@/firebase/server';
import type {
  Document,
  DocumentSuite,
  KnowledgeArticle,
  MembershipAccessGrant,
  MembershipPlan,
  PartnerOffer,
  PastProject,
  Testimonial,
  UserProfile,
} from './definitions';
import { MEMBERSHIP_TIERS } from './definitions';
import { logAuditEvent, saveContentRevision } from './audit';
import { safeLogAnalyticsEvent } from './analytics';
import { canPublishKnowledgeArticle, normalizeKnowledgeSlug, type KnowledgeContentType } from './knowledge-center';
import { getAccessMetadataForDocuShareSection, resolvePlanCodeToBillingCycle, resolvePlanCodeToTier } from './entitlements';
import { filterAndSortUsers, validateAdminRole } from './user-admin';
import { getPublicPartnerOffers, getPublicPastProjects, getPublicTestimonials } from './content-admin';
import { getDocuShareSectionContent as getDocuShareSectionContentFromCms, getFAQsByCategory as getFAQsByCategoryFromCms, getHomepageContent as getHomepageContentFromCms, getKnowledgeLandingContent as getKnowledgeLandingContentFromCms, getMembershipPageContent as getMembershipPageContentFromCms, getPageContentBySlug as getPageContentBySlugFromCms, getPublishedServicePages as getPublishedServicePagesFromCms, getServicePageBySlug as getServicePageBySlugFromCms, getServicesLandingContent as getServicesLandingContentFromCms } from './public-content';
import { ensureUniqueSlug, getDocushareSegment, normalizeSlug } from './content-objects';

const toIsoString = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

const isMembershipTier = (value: unknown): value is import('./definitions').MembershipTier =>
  typeof value === 'string' && MEMBERSHIP_TIERS.includes(value as import('./definitions').MembershipTier);


const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const normalizeMembershipStatus = (value: unknown): import('./definitions').MembershipStatus => {
  const status = String(value ?? 'pending').toLowerCase();
  if (['active', 'canceled', 'past_due', 'unpaid', 'pending', 'paused', 'suspended', 'lapsed'].includes(status)) {
    return status as import('./definitions').MembershipStatus;
  }
  return 'pending';
};


export async function getDocumentSuites(): Promise<DocumentSuite[]> {
  const suitesSnapshot = await firestore.collection('documentation_suites').get();

  const suites = suitesSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      contentType: data.contentType,
      entitlement: getAccessMetadataForDocuShareSection(data.contentType ?? 'templates'),
      slug: data.slug ? String(data.slug) : undefined,
      summary: data.summary ? String(data.summary) : undefined,
      category: data.category ? String(data.category) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag)) : [],
      status: (data.status as DocumentSuite['status'] | undefined) ?? 'published',
      featured: Boolean(data.featured),
      heroImageUrl: data.heroImageUrl ? String(data.heroImageUrl) : undefined,
      previewContent: data.previewContent ? String(data.previewContent) : undefined,
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      actionType: data.actionType as DocumentSuite['actionType'] | undefined,
      actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
      actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
      relatedContent: Array.isArray(data.relatedContent) ? data.relatedContent as DocumentSuite['relatedContent'] : [],
      templateDetails: data.templateDetails ? String(data.templateDetails) : undefined,
      whatsIncluded: Array.isArray(data.whatsIncluded) ? data.whatsIncluded.map((item: unknown) => String(item)) : [],
      companionResources: data.companionResources ? String(data.companionResources) : undefined,
      relatedTemplates: Array.isArray(data.relatedTemplates) ? data.relatedTemplates.map((item: unknown) => String(item)) : [],
      implementationNotes: data.implementationNotes ? String(data.implementationNotes) : undefined,
      implementationSteps: Array.isArray(data.implementationSteps) ? data.implementationSteps.map((item: unknown) => String(item)) : [],
      guidePurpose: data.guidePurpose ? String(data.guidePurpose) : undefined,
      guideSections: Array.isArray(data.guideSections) ? data.guideSections.map((item: unknown) => String(item)) : [],
      relatedTemplatesSummary: data.relatedTemplatesSummary ? String(data.relatedTemplatesSummary) : undefined,
      relatedResourcesSummary: data.relatedResourcesSummary ? String(data.relatedResourcesSummary) : undefined,
      relatedResources: Array.isArray(data.relatedResources) ? data.relatedResources.map((item: unknown) => String(item)) : [],
      suiteContentsSummary: data.suiteContentsSummary ? String(data.suiteContentsSummary) : undefined,
      suiteContents: Array.isArray(data.suiteContents) ? data.suiteContents.map((item: unknown) => String(item)) : [],
      documentStructure: data.documentStructure ? String(data.documentStructure) : undefined,
      documentStructureItems: Array.isArray(data.documentStructureItems) ? data.documentStructureItems.map((item: unknown) => String(item)) : [],
      implementationOrderSummary: data.implementationOrderSummary ? String(data.implementationOrderSummary) : undefined,
      implementationOrder: Array.isArray(data.implementationOrder) ? data.implementationOrder.map((item: unknown) => String(item)) : [],
      processOverview: data.processOverview ? String(data.processOverview) : undefined,
      processStages: Array.isArray(data.processStages) ? data.processStages.map((item: unknown) => String(item)) : [],
      rolesAndOwnershipSummary: data.rolesAndOwnershipSummary ? String(data.rolesAndOwnershipSummary) : undefined,
      rolesAndOwnership: Array.isArray(data.rolesAndOwnership) ? data.rolesAndOwnership.map((item: unknown) => String(item)) : [],
      includedAssetsSummary: data.includedAssetsSummary ? String(data.includedAssetsSummary) : undefined,
      includedAssets: Array.isArray(data.includedAssets) ? data.includedAssets.map((item: unknown) => String(item)) : [],
      toolOverview: data.toolOverview ? String(data.toolOverview) : undefined,
      toolComponents: Array.isArray(data.toolComponents) ? data.toolComponents.map((item: unknown) => String(item)) : [],
      howItWorks: data.howItWorks ? String(data.howItWorks) : undefined,
      howItWorksSteps: Array.isArray(data.howItWorksSteps) ? data.howItWorksSteps.map((item: unknown) => String(item)) : [],
      whenToUseSummary: data.whenToUseSummary ? String(data.whenToUseSummary) : undefined,
      whenToUse: Array.isArray(data.whenToUse) ? data.whenToUse.map((item: unknown) => String(item)) : [],
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      publishedAt: data.publishedAt ? toIsoString(data.publishedAt) : undefined,
    } as Omit<DocumentSuite, 'documents'>;
  });

  const docsSnapshot = await firestore.collectionGroup('documents').orderBy('uploadedAt', 'desc').get();
  const allDocuments = docsSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.aiGeneratedDescription,
      url: data.externalUrl || data.storagePath || '#',
      type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
      createdAt: toIsoString(data.uploadedAt),
      suiteId: data.documentationSuiteId,
      slug: data.slug ? String(data.slug) : undefined,
      summary: data.summary ? String(data.summary) : undefined,
      category: data.category ? String(data.category) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag)) : [],
      status: (data.status as Document['status'] | undefined) ?? 'published',
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      actionType: data.actionType as Document['actionType'] | undefined,
      actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
      actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
      previewContent: data.previewContent ? String(data.previewContent) : undefined,
    } as Document;
  });

  return suites.map((suite) => ({
    ...suite,
    documents: allDocuments.filter((document) => document.suiteId === suite.id),
  }));
}

export async function getAllDocuments(): Promise<Document[]> {
  const docsSnapshot = await firestore.collectionGroup('documents').orderBy('uploadedAt', 'desc').get();
  return docsSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.aiGeneratedDescription,
      url: data.externalUrl || data.storagePath || '#',
      type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
      createdAt: toIsoString(data.uploadedAt),
      suiteId: data.documentationSuiteId,
      slug: data.slug ? String(data.slug) : undefined,
      summary: data.summary ? String(data.summary) : undefined,
      category: data.category ? String(data.category) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag)) : [],
      status: (data.status as Document['status'] | undefined) ?? 'published',
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      actionType: data.actionType as Document['actionType'] | undefined,
      actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
      actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
      previewContent: data.previewContent ? String(data.previewContent) : undefined,
    } as Document;
  });
}

export async function getSuites(): Promise<Omit<DocumentSuite, 'documents'>[]> {
  const suitesSnapshot = await firestore.collection('documentation_suites').get();
  return suitesSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      contentType: data.contentType,
      slug: data.slug ? String(data.slug) : undefined,
      summary: data.summary ? String(data.summary) : undefined,
      category: data.category ? String(data.category) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag)) : [],
      status: (data.status as DocumentSuite['status'] | undefined) ?? 'published',
      featured: Boolean(data.featured),
      heroImageUrl: data.heroImageUrl ? String(data.heroImageUrl) : undefined,
      previewContent: data.previewContent ? String(data.previewContent) : undefined,
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      actionType: data.actionType as DocumentSuite['actionType'] | undefined,
      actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
      actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
      publishedAt: data.publishedAt ? toIsoString(data.publishedAt) : undefined,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
      entitlement: getAccessMetadataForDocuShareSection(data.contentType ?? 'templates'),
    };
  });
}

export async function addDocument(docData: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
  const { suiteId, name, description, url, type } = docData;
  const now = new Date();

  const existingSlugs = (await firestore.collectionGroup('documents').get()).docs.map((doc) => String(doc.data().slug ?? ''));
  const newDocData = {
    name,
    aiGeneratedDescription: description,
    slug: docData.slug ? normalizeSlug(docData.slug) : ensureUniqueSlug(name, existingSlugs),
    summary: docData.summary ?? description ?? '',
    category: docData.category ?? '',
    tags: normalizeTags(docData.tags),
    status: docData.status ?? 'published',
    seoTitle: docData.seoTitle ?? name,
    seoDescription: docData.seoDescription ?? description ?? '',
    actionType: docData.actionType ?? 'download',
    actionLabel: docData.actionLabel ?? 'Access resource',
    actionTarget: docData.actionTarget ?? url,
    previewContent: docData.previewContent ?? '',
    sourceType: type === 'drive' ? 'googleDrive' : 'upload',
    externalUrl: type === 'drive' ? url : '',
    storagePath: type === 'file' ? url : '',
    fileType: 'unknown',
    fileSize: 0,
    downloadCount: 0,
    uploadedAt: now,
    updatedAt: now,
    documentationSuiteId: suiteId,
  };

  const docRef = await firestore.collection(`documentation_suites/${suiteId}/documents`).add(newDocData);

  return {
    id: docRef.id,
    ...docData,
    createdAt: now.toISOString(),
  };
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<Document | null> {
  if (!data.suiteId) {
    throw new Error('suiteId is required for updating a document');
  }

  const docRef = firestore.doc(`documentation_suites/${data.suiteId}/documents/${id}`);
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name) updateData.name = data.name;
  if (data.slug) updateData.slug = normalizeSlug(data.slug);
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = normalizeTags(data.tags);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
  if (data.actionType !== undefined) updateData.actionType = data.actionType;
  if (data.actionLabel !== undefined) updateData.actionLabel = data.actionLabel;
  if (data.actionTarget !== undefined) updateData.actionTarget = data.actionTarget;
  if (data.previewContent !== undefined) updateData.previewContent = data.previewContent;
  if (data.description) updateData.aiGeneratedDescription = data.description;
  if (data.url) {
    if (data.type === 'drive') updateData.externalUrl = data.url;
    else updateData.storagePath = data.url;
  }
  if (data.type) updateData.sourceType = data.type === 'drive' ? 'googleDrive' : 'upload';
  if (data.suiteId) updateData.documentationSuiteId = data.suiteId;

  await docRef.update(updateData);

  const updatedDocSnap = await docRef.get();
  if (!updatedDocSnap.exists) return null;

  const docSnapData = updatedDocSnap.data();
  if (!docSnapData) return null;

  return {
    id: updatedDocSnap.id,
    name: docSnapData.name,
    description: docSnapData.aiGeneratedDescription,
    url: docSnapData.externalUrl || '#',
    type: docSnapData.sourceType === 'googleDrive' ? 'drive' : 'file',
    createdAt: toIsoString(docSnapData.uploadedAt),
    suiteId: docSnapData.documentationSuiteId,
  };
}

export async function deleteDocument(id: string, suiteId: string): Promise<boolean> {
  if (!suiteId) return false;
  await firestore.doc(`documentation_suites/${suiteId}/documents/${id}`).delete();
  return true;
}

export async function addSuite(
  suite: Omit<DocumentSuite, 'id' | 'documents'>,
): Promise<Omit<DocumentSuite, 'documents'>> {
  const existing = await firestore.collection('documentation_suites').get();
  const existingSlugs = existing.docs.map((doc) => String(doc.data().slug ?? ''));
  const slug = suite.slug ? normalizeSlug(suite.slug) : ensureUniqueSlug(suite.name, existingSlugs);
  const newSuiteData = {
    ...suite,
    slug,
    summary: suite.summary ?? suite.description,
    status: suite.status ?? 'published',
    actionType: suite.actionType ?? 'access',
    actionLabel: suite.actionLabel ?? 'View suite',
    actionTarget: suite.actionTarget ?? `/docushare/${getDocushareSegment(suite.contentType)}/${slug}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: suite.status === 'draft' ? null : new Date(),
  };
  const docRef = await firestore.collection('documentation_suites').add(newSuiteData);
  return {
    id: docRef.id,
    ...suite,
  };
}

export async function updateSuite(
  id: string,
  data: Partial<Omit<DocumentSuite, 'id' | 'documents'>>,
): Promise<Omit<DocumentSuite, 'documents'> | null> {
  const suiteRef = firestore.doc(`documentation_suites/${id}`);
  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if ('slug' in data && typeof (data as { slug?: string }).slug === 'string') updatePayload.slug = normalizeSlug((data as { slug?: string }).slug ?? '');
  if ('tags' in data) updatePayload.tags = normalizeTags((data as { tags?: unknown }).tags);
  await suiteRef.update(updatePayload);

  const updatedDocSnap = await suiteRef.get();
  if (!updatedDocSnap.exists) return null;

  const docData = updatedDocSnap.data();
  if (!docData) return null;

  return {
    id: updatedDocSnap.id,
    name: docData.name,
    description: docData.description,
    contentType: docData.contentType,
    slug: docData.slug ? String(docData.slug) : undefined,
    summary: docData.summary ? String(docData.summary) : undefined,
    category: docData.category ? String(docData.category) : undefined,
    tags: Array.isArray(docData.tags) ? docData.tags.map((tag: unknown) => String(tag)) : [],
    status: (docData.status as DocumentSuite['status'] | undefined) ?? 'published',
    featured: Boolean(docData.featured),
    heroImageUrl: docData.heroImageUrl ? String(docData.heroImageUrl) : undefined,
    previewContent: docData.previewContent ? String(docData.previewContent) : undefined,
    seoTitle: docData.seoTitle ? String(docData.seoTitle) : undefined,
    seoDescription: docData.seoDescription ? String(docData.seoDescription) : undefined,
    actionType: docData.actionType as DocumentSuite['actionType'] | undefined,
    actionLabel: docData.actionLabel ? String(docData.actionLabel) : undefined,
    actionTarget: docData.actionTarget ? String(docData.actionTarget) : undefined,
    publishedAt: docData.publishedAt ? toIsoString(docData.publishedAt) : undefined,
    createdAt: toIsoString(docData.createdAt),
    updatedAt: toIsoString(docData.updatedAt),
  };
}

export async function deleteSuite(id: string): Promise<boolean> {
  const suiteRef = firestore.doc(`documentation_suites/${id}`);
  const docsSnapshot = await firestore.collection(`documentation_suites/${id}/documents`).get();

  const batch = firestore.batch();

  docsSnapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  batch.delete(suiteRef);

  await batch.commit();
  return true;
}

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const snapshot = await firestore.collection('membership_plans').orderBy('amount', 'asc').get();
  return snapshot.docs.map((d) => {
    const data = d.data();
    const code = data.code ?? 'basic_free';
    return {
      id: d.id,
      code,
      tier: data.tier ?? resolvePlanCodeToTier(code),
      billingCycle: data.billingCycle ?? resolvePlanCodeToBillingCycle(code),
      name: data.name,
      description: data.description,
      currency: data.currency,
      amount: data.amount,
      interval: data.interval ?? resolvePlanCodeToBillingCycle(code),
      active: Boolean(data.active),
      promotionEligible: Boolean(data.promotionEligible ?? true),
      squareSubscriptionPlanVariationId: data.squareSubscriptionPlanVariationId ?? null,
      squareSubscriptionPlanId: data.squareSubscriptionPlanId ?? null,
      squareLocationId: data.squareLocationId ?? null,
      squareCatalogObjectVersion: data.squareCatalogObjectVersion ?? null,
    };
  });
}

export async function createMembershipPlan(
  plan: Omit<MembershipPlan, 'id'>,
  actorUserId: string,
): Promise<MembershipPlan> {
  const docRef = await firestore.collection('membership_plans').add({
    ...plan,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'plan_create', targetId: docRef.id, targetType: 'membership_plan', after: plan });
  return { id: docRef.id, ...plan };
}

export async function updateMembershipPlan(
  id: string,
  data: Partial<Omit<MembershipPlan, 'id'>>,
  actorUserId: string,
): Promise<MembershipPlan | null> {
  const ref = firestore.doc(`membership_plans/${id}`);
  const beforeSnapshot = await ref.get();
  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if ('slug' in data && typeof (data as { slug?: string }).slug === 'string') updatePayload.slug = normalizeSlug((data as { slug?: string }).slug ?? '');
  await ref.update(updatePayload);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const plan = snapshot.data();
  if (!plan) return null;

  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'plan_update', targetId: id, targetType: 'membership_plan', before: beforeSnapshot.data() ?? null, after: snapshot.data() ?? null });
  const code = plan.code ?? 'basic_free';
  return {
    id: snapshot.id,
    code,
    tier: plan.tier ?? resolvePlanCodeToTier(code),
    billingCycle: plan.billingCycle ?? resolvePlanCodeToBillingCycle(code),
    name: plan.name,
    description: plan.description,
    currency: plan.currency,
    amount: plan.amount,
    interval: plan.interval ?? resolvePlanCodeToBillingCycle(code),
    active: Boolean(plan.active),
    promotionEligible: Boolean(plan.promotionEligible ?? true),
    squareSubscriptionPlanVariationId: plan.squareSubscriptionPlanVariationId ?? null,
    squareSubscriptionPlanId: plan.squareSubscriptionPlanId ?? null,
    squareLocationId: plan.squareLocationId ?? null,
    squareCatalogObjectVersion: plan.squareCatalogObjectVersion ?? null,
  };
}

export async function deleteMembershipPlan(id: string, actorUserId: string): Promise<boolean> {
  const ref = firestore.doc(`membership_plans/${id}`);
  const before = await ref.get();
  await ref.delete();
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'plan_delete', targetId: id, targetType: 'membership_plan', before: before.data() ?? null });
  return true;
}

export async function getKnowledgeArticles(query: KnowledgeArticleQuery = {}): Promise<KnowledgeArticle[]> {
  return getKnowledgeArticlesWithFilters(query);
}

type KnowledgeArticleQuery = {
  type?: KnowledgeContentType;
  published?: boolean;
  featured?: boolean;
  search?: string;
  sortBy?: 'updatedAt' | 'createdAt' | 'publishedAt';
  sortDirection?: 'asc' | 'desc';
};

function normalizeKnowledgeArticle(id: string, data: Record<string, unknown>): KnowledgeArticle {
  return {
    id,
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
    summary: data.summary ? String(data.summary) : undefined,
    content: String(data.content ?? ''),
    category: data.category ? String(data.category) : undefined,
    contentType: (data.contentType ?? data.type ?? 'article') as KnowledgeArticle['contentType'],
    tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
    authorId: data.authorId ? String(data.authorId) : undefined,
    authorName: data.authorName ? String(data.authorName) : undefined,
    published: Boolean(data.published),
    featured: Boolean(data.featured),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
    externalLink: data.externalLink ? String(data.externalLink) : undefined,
    ctaLabel: data.ctaLabel ? String(data.ctaLabel) : undefined,
    ctaType: data.ctaType as KnowledgeArticle['ctaType'] | undefined,
    keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways.map((item: unknown) => String(item)) : [],
    guideSections: Array.isArray(data.guideSections) ? data.guideSections.map((item: unknown) => String(item)) : [],
    downloadableResources: Array.isArray(data.downloadableResources) ? data.downloadableResources.map((item: unknown) => String(item)) : [],
    downloadableResourcesSummary: data.downloadableResourcesSummary ? String(data.downloadableResourcesSummary) : undefined,
    toolComponents: Array.isArray(data.toolComponents) ? data.toolComponents.map((item: unknown) => String(item)) : [],
    howItWorks: data.howItWorks ? String(data.howItWorks) : undefined,
    howItWorksSteps: Array.isArray(data.howItWorksSteps) ? data.howItWorksSteps.map((item: unknown) => String(item)) : [],
    whenToUse: Array.isArray(data.whenToUse) ? data.whenToUse.map((item: unknown) => String(item)) : [],
    exampleApplication: data.exampleApplication ? String(data.exampleApplication) : undefined,
    exampleSteps: Array.isArray(data.exampleSteps) ? data.exampleSteps.map((item: unknown) => String(item)) : [],
    embeddedResources: Array.isArray(data.embeddedResources) ? data.embeddedResources.map((item: unknown) => String(item)) : [],
    embeddedResourcesSummary: data.embeddedResourcesSummary ? String(data.embeddedResourcesSummary) : undefined,
    relatedResources: Array.isArray(data.relatedResources) ? data.relatedResources.map((item: unknown) => String(item)) : [],
    relatedResourcesSummary: data.relatedResourcesSummary ? String(data.relatedResourcesSummary) : undefined,
    relatedContent: Array.isArray(data.relatedContent) ? (data.relatedContent as KnowledgeArticle['relatedContent']) : [],
    entitlement: (data.entitlement as import('./definitions').EntitlementAccessFields | undefined) ?? undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    publishedAt: data.publishedAt ? toIsoString(data.publishedAt) : undefined,
  };
}

export async function getKnowledgeArticlesWithFilters(query: KnowledgeArticleQuery = {}): Promise<KnowledgeArticle[]> {
  const snapshot = await firestore.collection('knowledge_articles').orderBy('createdAt', 'desc').get();
  let rows = snapshot.docs.map((d) => normalizeKnowledgeArticle(d.id, d.data()));

  if (query.type) rows = rows.filter((article) => article.contentType === query.type);
  if (typeof query.published === 'boolean') rows = rows.filter((article) => article.published === query.published);
  if (typeof query.featured === 'boolean') rows = rows.filter((article) => Boolean(article.featured) === query.featured);
  if (query.search?.trim()) {
    const needle = query.search.trim().toLowerCase();
    rows = rows.filter((article) => article.title.toLowerCase().includes(needle) || article.slug.toLowerCase().includes(needle));
  }

  const sortBy = query.sortBy ?? 'createdAt';
  const dir = query.sortDirection === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const aValue = sortBy === 'publishedAt' ? a.publishedAt ?? '' : a[sortBy] ?? '';
    const bValue = sortBy === 'publishedAt' ? b.publishedAt ?? '' : b[sortBy] ?? '';
    return (new Date(aValue).getTime() - new Date(bValue).getTime()) * dir;
  });

  return rows;
}

export async function getKnowledgeArticleBySlug(slug: string, includeDrafts = false): Promise<KnowledgeArticle | null> {
  const snapshot = await firestore
    .collection('knowledge_articles')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const article = normalizeKnowledgeArticle(snapshot.docs[0].id, snapshot.docs[0].data());
  if (!includeDrafts && !article.published) return null;
  return article;
}

export async function isKnowledgeSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  const snapshot = await firestore.collection('knowledge_articles').where('slug', '==', slug).get();
  if (snapshot.empty) return true;
  return snapshot.docs.every((doc) => doc.id === excludeId);
}

export async function createKnowledgeArticle(
  article: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>,
  actorUserId: string,
): Promise<KnowledgeArticle> {
  const now = new Date();
  const normalizedSlug = normalizeKnowledgeSlug(article.slug);
  const isUnique = await isKnowledgeSlugUnique(normalizedSlug);
  if (!isUnique) {
    throw new Error('A knowledge article with this slug already exists.');
  }

  if (article.published && !canPublishKnowledgeArticle(article)) {
    throw new Error('Published content requires title, slug, and content.');
  }

  const docRef = await firestore.collection('knowledge_articles').add({
    ...article,
    slug: normalizedSlug,
    contentType: article.contentType,
    featured: Boolean(article.featured),
    tags: article.tags ?? [],
    createdAt: now,
    updatedAt: now,
    publishedAt: article.published ? now : null,
  });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'knowledge_article' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'knowledge_article' });
  return normalizeKnowledgeArticle(docRef.id, {
    ...article,
    slug: normalizedSlug,
    createdAt: now,
    updatedAt: now,
    publishedAt: article.published ? now : null,
  });
}

export async function updateKnowledgeArticle(
  id: string,
  data: Partial<Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>,
  actorUserId: string,
): Promise<KnowledgeArticle | null> {
  const ref = firestore.doc(`knowledge_articles/${id}`);
  const beforeSnapshot = await ref.get();
  if (!beforeSnapshot.exists) return null;

  const beforeData = beforeSnapshot.data() ?? {};
  const nextSlug = data.slug ? normalizeKnowledgeSlug(data.slug) : beforeData.slug;
  if (!nextSlug) {
    throw new Error('Slug is required.');
  }

  const isUnique = await isKnowledgeSlugUnique(nextSlug, id);
  if (!isUnique) {
    throw new Error('A knowledge article with this slug already exists.');
  }

  const nextPublished = data.published ?? Boolean(beforeData.published);
  const nextTitle = data.title ?? beforeData.title;
  const nextContent = data.content ?? beforeData.content;

  if (nextPublished && !canPublishKnowledgeArticle({ title: nextTitle, slug: nextSlug, content: nextContent })) {
    throw new Error('Published content requires title, slug, and content.');
  }

  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  if (typeof data.featured === 'boolean') updatePayload.featured = data.featured;
  if (data.tags) updatePayload.tags = data.tags;
  if (nextPublished && !beforeData.publishedAt) {
    updatePayload.publishedAt = new Date();
  }
  if (!nextPublished) {
    updatePayload.publishedAt = null;
  }

  await ref.update(updatePayload);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const article = snapshot.data();
  if (!article) return null;

  await saveContentRevision({ contentType: 'knowledge_article', contentId: id, editorUserId: actorUserId, previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'knowledge_article' });
  return {
    id: snapshot.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    contentType: article.contentType,
    tags: article.tags,
    authorId: article.authorId,
    published: Boolean(article.published),
    createdAt: toIsoString(article.createdAt),
    updatedAt: toIsoString(article.updatedAt),
  };
}

export async function publishKnowledgeArticle(id: string, actorUserId: string): Promise<KnowledgeArticle | null> {
  return updateKnowledgeArticle(id, { published: true }, actorUserId);
}

export async function unpublishKnowledgeArticle(id: string, actorUserId: string): Promise<KnowledgeArticle | null> {
  return updateKnowledgeArticle(id, { published: false }, actorUserId);
}

export async function deleteKnowledgeArticle(id: string, actorUserId: string): Promise<boolean> {
  const ref = firestore.doc(`knowledge_articles/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'knowledge_article', contentId: id, editorUserId: actorUserId, previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'knowledge_article' });
  return true;
}

export async function getPartnerOffers(): Promise<PartnerOffer[]> {
  const snapshot = await firestore.collection('partner_offers').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      link: data.link,
      active: Boolean(data.active),
      slug: data.slug ? String(data.slug) : undefined,
      summary: data.summary ? String(data.summary) : undefined,
      partnerName: data.partnerName ? String(data.partnerName) : undefined,
      partnerOverview: data.partnerOverview ? String(data.partnerOverview) : undefined,
      partnerServices: Array.isArray(data.partnerServices) ? data.partnerServices.map((item: unknown) => String(item)) : [],
      whyWeRecommend: data.whyWeRecommend ? String(data.whyWeRecommend) : undefined,
      offerValue: data.offerValue ? String(data.offerValue) : undefined,
      offerDetails: data.offerDetails ? String(data.offerDetails) : undefined,
      claimInstructions: data.claimInstructions ? String(data.claimInstructions) : undefined,
      termsAndConditions: data.termsAndConditions ? String(data.termsAndConditions) : undefined,
      redemptionCode: data.redemptionCode ? String(data.redemptionCode) : undefined,
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      categories: Array.isArray(data.categories) ? data.categories.map((value: unknown) => String(value)) : undefined,
      imageUrl: data.imageUrl ?? undefined,
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      expiresAt: data.expiresAt ? toIsoString(data.expiresAt) : null,
      relatedOfferIds: Array.isArray(data.relatedOfferIds) ? data.relatedOfferIds.map((item: unknown) => String(item)) : [],
      actionType: data.actionType as PartnerOffer['actionType'] | undefined,
      actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
      actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
      publishedAt: data.publishedAt ? toIsoString(data.publishedAt) : undefined,
      entitlement: (data.entitlement as import('./definitions').EntitlementAccessFields | undefined) ?? undefined,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function createPartnerOffer(
  offer: Omit<PartnerOffer, 'id' | 'createdAt' | 'updatedAt'>,
  actorUserId: string,
): Promise<PartnerOffer> {
  const now = new Date();
  const existing = await firestore.collection('partner_offers').get();
  const slug = offer.slug ? normalizeSlug(offer.slug) : ensureUniqueSlug(offer.title, existing.docs.map((doc) => String(doc.data().slug ?? '')));
  const docRef = await firestore.collection('partner_offers').add({
    ...offer,
    slug,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'partner_offer' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'partner_offer' });
  return { id: docRef.id, ...offer, slug, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function updatePartnerOffer(
  id: string,
  data: Partial<Omit<PartnerOffer, 'id' | 'createdAt' | 'updatedAt'>>,
  actorUserId: string,
): Promise<PartnerOffer | null> {
  const ref = firestore.doc(`partner_offers/${id}`);
  const beforeSnapshot = await ref.get();
  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if ('slug' in data && typeof (data as { slug?: string }).slug === 'string') updatePayload.slug = normalizeSlug((data as { slug?: string }).slug ?? '');
  await ref.update(updatePayload);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const offer = snapshot.data();
  if (!offer) return null;

  await saveContentRevision({ contentType: 'partner_offer', contentId: id, editorUserId: actorUserId, previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'partner_offer' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userRole: 'admin', targetId: id, targetType: 'partner_offer' });
  return {
    id: snapshot.id,
    title: offer.title,
    description: offer.description,
    link: offer.link,
    active: Boolean(offer.active),
    partnerName: offer.partnerName ? String(offer.partnerName) : undefined,
    partnerOverview: offer.partnerOverview ? String(offer.partnerOverview) : undefined,
    partnerServices: Array.isArray(offer.partnerServices) ? offer.partnerServices.map((value: unknown) => String(value)) : [],
    whyWeRecommend: offer.whyWeRecommend ? String(offer.whyWeRecommend) : undefined,
    offerValue: offer.offerValue ? String(offer.offerValue) : undefined,
    offerDetails: offer.offerDetails ? String(offer.offerDetails) : undefined,
    claimInstructions: offer.claimInstructions ? String(offer.claimInstructions) : undefined,
    termsAndConditions: offer.termsAndConditions ? String(offer.termsAndConditions) : undefined,
    redemptionCode: offer.redemptionCode ? String(offer.redemptionCode) : undefined,
    categories: Array.isArray(offer.categories) ? offer.categories.map((value: unknown) => String(value)) : undefined,
    imageUrl: offer.imageUrl ?? undefined,
    displayOrder: typeof offer.displayOrder === 'number' ? offer.displayOrder : 0,
    expiresAt: offer.expiresAt ? toIsoString(offer.expiresAt) : null,
    entitlement: (offer.entitlement as import('./definitions').EntitlementAccessFields | undefined) ?? undefined,
    createdAt: toIsoString(offer.createdAt),
    updatedAt: toIsoString(offer.updatedAt),
  };
}

export async function deletePartnerOffer(id: string, actorUserId: string): Promise<boolean> {
  const ref = firestore.doc(`partner_offers/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'partner_offer', contentId: id, editorUserId: actorUserId, previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'partner_offer' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_deleted', userRole: 'admin', targetId: id, targetType: 'partner_offer' });
  return true;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const snapshot = await firestore.collection('testimonials').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      clientName: data.clientName,
      content: data.content,
      role: data.role,
      company: data.company,
      active: Boolean(data.active ?? true),
      imageUrl: data.imageUrl ?? undefined,
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function createTestimonial(
  testimonial: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>,
  actorUserId: string,
): Promise<Testimonial> {
  const now = new Date();
  const docRef = await firestore.collection('testimonials').add({
    ...testimonial,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'testimonial' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'testimonial' });
  return {
    id: docRef.id,
    ...testimonial,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateTestimonial(
  id: string,
  data: Partial<Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>>,
  actorUserId: string,
): Promise<Testimonial | null> {
  const ref = firestore.doc(`testimonials/${id}`);
  const beforeSnapshot = await ref.get();
  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if ('slug' in data && typeof (data as { slug?: string }).slug === 'string') updatePayload.slug = normalizeSlug((data as { slug?: string }).slug ?? '');
  await ref.update(updatePayload);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const testimonial = snapshot.data();
  if (!testimonial) return null;

  await saveContentRevision({ contentType: 'testimonial', contentId: id, editorUserId: actorUserId, previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'testimonial' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userRole: 'admin', targetId: id, targetType: 'testimonial' });
  return {
    id: snapshot.id,
    clientName: testimonial.clientName,
    content: testimonial.content,
    role: testimonial.role,
    company: testimonial.company,
    active: Boolean(testimonial.active ?? true),
    imageUrl: testimonial.imageUrl ?? undefined,
    displayOrder: typeof testimonial.displayOrder === 'number' ? testimonial.displayOrder : 0,
    createdAt: toIsoString(testimonial.createdAt),
    updatedAt: toIsoString(testimonial.updatedAt),
  };
}

export async function deleteTestimonial(id: string, actorUserId: string): Promise<boolean> {
  const ref = firestore.doc(`testimonials/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'testimonial', contentId: id, editorUserId: actorUserId, previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'testimonial' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_deleted', userRole: 'admin', targetId: id, targetType: 'testimonial' });
  return true;
}

export async function getPastProjects(): Promise<PastProject[]> {
  const snapshot = await firestore.collection('past_projects').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      link: data.link,
      active: Boolean(data.active ?? true),
      imageUrl: data.imageUrl ?? undefined,
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function createPastProject(
  project: Omit<PastProject, 'id' | 'createdAt' | 'updatedAt'>,
  actorUserId: string,
): Promise<PastProject> {
  const now = new Date();
  const docRef = await firestore.collection('past_projects').add({
    ...project,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'past_project' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'past_project' });
  return {
    id: docRef.id,
    ...project,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updatePastProject(
  id: string,
  data: Partial<Omit<PastProject, 'id' | 'createdAt' | 'updatedAt'>>,
  actorUserId: string,
): Promise<PastProject | null> {
  const ref = firestore.doc(`past_projects/${id}`);
  const beforeSnapshot = await ref.get();
  const updatePayload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if ('slug' in data && typeof (data as { slug?: string }).slug === 'string') updatePayload.slug = normalizeSlug((data as { slug?: string }).slug ?? '');
  await ref.update(updatePayload);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const project = snapshot.data();
  if (!project) return null;

  await saveContentRevision({ contentType: 'past_project', contentId: id, editorUserId: actorUserId, previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'past_project' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userRole: 'admin', targetId: id, targetType: 'past_project' });
  return {
    id: snapshot.id,
    name: project.name,
    description: project.description,
    link: project.link,
    active: Boolean(project.active ?? true),
    imageUrl: project.imageUrl ?? undefined,
    displayOrder: typeof project.displayOrder === 'number' ? project.displayOrder : 0,
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt),
  };
}

export async function deletePastProject(id: string, actorUserId: string): Promise<boolean> {
  const ref = firestore.doc(`past_projects/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'past_project', contentId: id, editorUserId: actorUserId, previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'past_project' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_deleted', userRole: 'admin', targetId: id, targetType: 'past_project' });
  return true;
}


export async function getActivePartnerOffers(): Promise<PartnerOffer[]> {
  const offers = await getPartnerOffers();
  return getPublicPartnerOffers(offers);
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const testimonials = await getTestimonials();
  return getPublicTestimonials(testimonials);
}

export async function getPublishedPastProjects(): Promise<PastProject[]> {
  const projects = await getPastProjects();
  return getPublicPastProjects(projects);
}

const ADMIN_EDITABLE_USER_FIELDS = new Set(['name', 'phone', 'company']);

function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    company: data.company ? String(data.company) : null,
    phone: data.phone ? String(data.phone) : null,
    role: String(data.role ?? 'member'),
    membershipTier: isMembershipTier(data.membershipTier) ? data.membershipTier : null,
    membershipStatus: normalizeMembershipStatus(data.membershipStatus),
    membershipPlanCode: data.membershipPlanCode ? String(data.membershipPlanCode) as UserProfile['membershipPlanCode'] : null,
    billingCycle: data.billingCycle ? String(data.billingCycle) as UserProfile['billingCycle'] : null,
    emailVerified: Boolean(data.emailVerified),
    lastLoginAt: data.lastLoginAt ? toIsoString(data.lastLoginAt) : null,
    accountStatus: data.accountStatus === 'suspended' ? 'suspended' : 'active',
    accessExpiry: data.accessExpiry ? toIsoString(data.accessExpiry) : null,
    squareCustomerId: data.squareCustomerId ? String(data.squareCustomerId) : null,
    squareSubscriptionId: data.squareSubscriptionId ? String(data.squareSubscriptionId) : null,
    lastPaymentStatus: data.lastPaymentStatus ? String(data.lastPaymentStatus) : null,
    lastPaymentAt: data.lastPaymentAt ? toIsoString(data.lastPaymentAt) : null,
    activePromotionGrantEndAt: data.activePromotionGrantEndAt ? toIsoString(data.activePromotionGrantEndAt) : null,
    activePromotionGrantTier: data.activePromotionGrantTier && isMembershipTier(data.activePromotionGrantTier) ? data.activePromotionGrantTier : null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function getUsersForAdmin(): Promise<UserProfile[]> {
  const snapshot = await firestore.collection('users').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => mapUserProfile(doc.id, doc.data()));
}

export async function getUsers(filters: import('./definitions').UserAdminListFilters = {}): Promise<import('./definitions').UserAdminListResult> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize ?? 25)));
  const users = await getUsersForAdmin();
  const sorted = filterAndSortUsers(users, filters);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snapshot = await firestore.doc(`users/${uid}`).get();
  if (!snapshot.exists) return null;
  return mapUserProfile(snapshot.id, snapshot.data() ?? {});
}

export async function getUserAdminActivity(uid: string): Promise<import('./definitions').UserAdminActivity> {
  const [analyticsSnap, auditSnap, membershipHistorySnap, notificationsSnap] = await Promise.all([
    firestore.collection('analytics_events').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(10).get(),
    firestore.collection('audit_logs').where('targetId', '==', uid).orderBy('createdAt', 'desc').limit(10).get(),
    firestore.collection('membership_history').where('memberId', '==', uid).orderBy('changedAt', 'desc').limit(10).get(),
    firestore.collection('notifications').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(10).get(),
  ]);

  return {
    analyticsEvents: analyticsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt) } as import('./definitions').AnalyticsEventRecord)),
    auditEvents: auditSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toIsoString(doc.data().createdAt) } as import('./definitions').AuditLogRecord)),
    membershipHistory: membershipHistorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), changedAt: toIsoString(doc.data().changedAt) } as import('./definitions').MembershipHistoryItem)),
    notifications: notificationsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        audienceRole: data.audienceRole,
        audienceType: data.audienceType ?? 'direct',
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        severity: data.severity ?? 'info',
        read: Boolean(data.read),
        readAt: data.readAt ? toIsoString(data.readAt) : undefined,
        metadata: data.metadata ?? {},
        createdAt: toIsoString(data.createdAt),
      };
    }),
  };
}

export async function updateUserAdminFields(
  uid: string,
  data: Partial<Pick<UserProfile, 'name' | 'phone' | 'company'>>,
  actorUserId: string,
): Promise<UserProfile | null> {
  const cleanUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (ADMIN_EDITABLE_USER_FIELDS.has(key) && typeof value === 'string') {
      cleanUpdates[key] = value.trim();
    }
  }

  const ref = firestore.doc(`users/${uid}`);
  const before = await ref.get();
  if (!before.exists) return null;

  await ref.update({ ...cleanUpdates, updatedAt: new Date() });
  const after = await ref.get();
  if (!after.exists) return null;

  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'user_profile_admin_edit', targetId: uid, targetType: 'user', before: before.data() ?? null, after: after.data() ?? null });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userId: actorUserId, userRole: 'admin', targetId: uid, targetType: 'user' });

  return mapUserProfile(after.id, after.data() ?? {});
}

export async function updateUserRole(uid: string, role: string, actorUserId: string): Promise<UserProfile | null> {
  const nextRole = role.trim().toLowerCase();
  if (!validateAdminRole(nextRole)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const ref = firestore.doc(`users/${uid}`);
  const before = await ref.get();
  if (!before.exists) return null;

  await ref.update({ role: nextRole, updatedAt: new Date() });

  const adminRoleRef = firestore.doc(`roles_admin/${uid}`);
  if (nextRole === 'admin') {
    await adminRoleRef.set({ role: 'admin', updatedAt: new Date() }, { merge: true });
  } else {
    const adminRoleSnap = await adminRoleRef.get();
    if (adminRoleSnap.exists) await adminRoleRef.delete();
  }

  const after = await ref.get();
  if (!after.exists) return null;

  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'user_profile_admin_edit', targetId: uid, targetType: 'user', before: before.data() ?? null, after: after.data() ?? null, metadata: { change: 'role' } });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userId: actorUserId, userRole: 'admin', targetId: uid, targetType: 'user' });
  return mapUserProfile(after.id, after.data() ?? {});
}

export async function updateUserAccountStatus(
  uid: string,
  accountStatus: UserProfile['accountStatus'],
  actorUserId: string,
): Promise<UserProfile | null> {
  const nextStatus = accountStatus === 'suspended' ? 'suspended' : 'active';
  const ref = firestore.doc(`users/${uid}`);
  const before = await ref.get();
  if (!before.exists) return null;

  await ref.update({ accountStatus: nextStatus, updatedAt: new Date() });
  const after = await ref.get();
  if (!after.exists) return null;

  await logAuditEvent({ actorUserId, actorRole: 'admin', actionType: 'user_profile_admin_edit', targetId: uid, targetType: 'user', before: before.data() ?? null, after: after.data() ?? null, metadata: { change: 'account_status' } });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userId: actorUserId, userRole: 'admin', targetId: uid, targetType: 'user' });
  return mapUserProfile(after.id, after.data() ?? {});
}

export async function updateUserAdminProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'name' | 'role' | 'membershipTier' | 'membershipStatus' | 'accountStatus'>>,
  actorUserId: string,
): Promise<UserProfile | null> {
  let next = await getUserById(uid);
  if (data.name) {
    next = await updateUserAdminFields(uid, { name: data.name }, actorUserId);
  }
  if (!next) return null;

  if (data.role) {
    next = await updateUserRole(uid, data.role, actorUserId);
    if (!next) return null;
  }

  if (data.accountStatus) {
    next = await updateUserAccountStatus(uid, data.accountStatus, actorUserId);
    if (!next) return null;
  }

  if (data.membershipTier || data.membershipStatus) {
    const ref = firestore.doc(`users/${uid}`);
    await ref.update({ membershipTier: data.membershipTier ?? next.membershipTier ?? null, membershipStatus: data.membershipStatus ?? next.membershipStatus ?? 'pending', updatedAt: new Date() });
    next = await getUserById(uid);
  }

  return next;
}


export const getHomepageContent = getHomepageContentFromCms;


export async function getSuiteBySlug(slug: string): Promise<DocumentSuite | null> {
  const snapshot = await firestore.collection('documentation_suites').where('slug', '==', normalizeSlug(slug)).limit(1).get();
  if (snapshot.empty) return null;
  const suiteId = snapshot.docs[0].id;
  const suites = await getDocumentSuites();
  return suites.find((suite) => suite.id === suiteId) ?? null;
}

export async function getDocumentBySlug(slug: string): Promise<Document | null> {
  const snapshot = await firestore.collectionGroup('documents').where('slug', '==', normalizeSlug(slug)).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: String(data.name ?? ''),
    description: String(data.aiGeneratedDescription ?? ''),
    url: String(data.externalUrl || data.storagePath || '#'),
    type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
    createdAt: toIsoString(data.uploadedAt),
    suiteId: String(data.documentationSuiteId ?? ''),
    slug: data.slug ? String(data.slug) : undefined,
    summary: data.summary ? String(data.summary) : undefined,
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map((item: unknown) => String(item)) : [],
    status: (data.status as Document['status'] | undefined) ?? 'published',
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
    actionType: data.actionType as Document['actionType'] | undefined,
    actionLabel: data.actionLabel ? String(data.actionLabel) : undefined,
    actionTarget: data.actionTarget ? String(data.actionTarget) : undefined,
    previewContent: data.previewContent ? String(data.previewContent) : undefined,
  };
}

export async function getPartnerOfferBySlug(slug: string): Promise<PartnerOffer | null> {
  const snapshot = await firestore.collection('partner_offers').where('slug', '==', normalizeSlug(slug)).limit(1).get();
  if (snapshot.empty) return null;
  const offers = await getPartnerOffers();
  return offers.find((offer) => offer.id === snapshot.docs[0].id) ?? null;
}

export const getServicePageBySlug = getServicePageBySlugFromCms;
export const getPublishedServicePages = getPublishedServicePagesFromCms;
export const getServicesLandingContent = getServicesLandingContentFromCms;
export const getMembershipPageContent = getMembershipPageContentFromCms;
export const getFAQsByCategory = getFAQsByCategoryFromCms;
export const getKnowledgeLandingContent = getKnowledgeLandingContentFromCms;
export const getDocuShareSectionContent = getDocuShareSectionContentFromCms;
export const getPageContentBySlug = getPageContentBySlugFromCms;


export async function getMembershipAccessGrantsForUser(userId: string): Promise<MembershipAccessGrant[]> {
  const snapshot = await firestore.collection('membership_access_grants').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: String(data.userId ?? userId),
      sourceType: data.sourceType ?? 'system',
      sourceReferenceId: String(data.sourceReferenceId ?? ''),
      grantTier: data.grantTier ?? 'basic',
      grantStartAt: toIsoString(data.grantStartAt),
      grantEndAt: toIsoString(data.grantEndAt),
      status: data.status ?? 'active',
      notes: data.notes ? String(data.notes) : undefined,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    } as MembershipAccessGrant;
  });
}
