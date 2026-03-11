import { firestore } from '@/firebase/server';
import type {
  Document,
  DocumentSuite,
  KnowledgeArticle,
  MembershipPlan,
  PartnerOffer,
  PastProject,
  Testimonial,
  UserProfile,
} from './definitions';
import { logAuditEvent, saveContentRevision } from './audit';
import { safeLogAnalyticsEvent } from './analytics';
import { canPublishKnowledgeArticle, type KnowledgeContentType } from './knowledge-center';
import { filterAndSortUsers, validateAdminRole } from './user-admin';

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


const sortByDisplayOrderThenCreatedAt = <T extends { displayOrder?: number; createdAt: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 0;
    const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
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
    } as Omit<DocumentSuite, 'documents'>;
  });

  const docsSnapshot = await firestore.collectionGroup('documents').orderBy('uploadedAt', 'desc').get();
  const allDocuments = docsSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.aiGeneratedDescription,
      url: data.externalUrl || '#',
      type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
      createdAt: toIsoString(data.uploadedAt),
      suiteId: data.documentationSuiteId,
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
      url: data.externalUrl || '#',
      type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
      createdAt: toIsoString(data.uploadedAt),
      suiteId: data.documentationSuiteId,
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
    };
  });
}

export async function addDocument(docData: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
  const { suiteId, name, description, url, type } = docData;
  const now = new Date();

  const newDocData = {
    name,
    aiGeneratedDescription: description,
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
  const newSuiteData = {
    ...suite,
    createdAt: new Date(),
    updatedAt: new Date(),
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
  await suiteRef.update({ ...data, updatedAt: new Date() });

  const updatedDocSnap = await suiteRef.get();
  if (!updatedDocSnap.exists) return null;

  const docData = updatedDocSnap.data();
  if (!docData) return null;

  return {
    id: updatedDocSnap.id,
    name: docData.name,
    description: docData.description,
    contentType: docData.contentType,
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
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      currency: data.currency,
      amount: data.amount,
      interval: data.interval,
      active: Boolean(data.active),
      squareSubscriptionPlanVariationId: data.squareSubscriptionPlanVariationId ?? null,
      squareSubscriptionPlanId: data.squareSubscriptionPlanId ?? null,
      squareLocationId: data.squareLocationId ?? null,
      squareCatalogObjectVersion: data.squareCatalogObjectVersion ?? null,
    };
  });
}

export async function createMembershipPlan(
  plan: Omit<MembershipPlan, 'id'>,
): Promise<MembershipPlan> {
  const docRef = await firestore.collection('membership_plans').add({
    ...plan,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'plan_create', targetId: docRef.id, targetType: 'membership_plan', after: plan });
  return { id: docRef.id, ...plan };
}

export async function updateMembershipPlan(
  id: string,
  data: Partial<Omit<MembershipPlan, 'id'>>,
): Promise<MembershipPlan | null> {
  const ref = firestore.doc(`membership_plans/${id}`);
  const beforeSnapshot = await ref.get();
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const plan = snapshot.data();
  if (!plan) return null;

  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'plan_update', targetId: id, targetType: 'membership_plan', before: beforeSnapshot.data() ?? null, after: snapshot.data() ?? null });
  return {
    id: snapshot.id,
    name: plan.name,
    description: plan.description,
    currency: plan.currency,
    amount: plan.amount,
    interval: plan.interval,
    active: Boolean(plan.active),
    squareSubscriptionPlanVariationId: plan.squareSubscriptionPlanVariationId ?? null,
    squareSubscriptionPlanId: plan.squareSubscriptionPlanId ?? null,
    squareLocationId: plan.squareLocationId ?? null,
    squareCatalogObjectVersion: plan.squareCatalogObjectVersion ?? null,
  };
}

export async function deleteMembershipPlan(id: string): Promise<boolean> {
  const ref = firestore.doc(`membership_plans/${id}`);
  const before = await ref.get();
  await ref.delete();
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'plan_delete', targetId: id, targetType: 'membership_plan', before: before.data() ?? null });
  return true;
}

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const snapshot = await firestore.collection('knowledge_articles').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      contentType: data.contentType,
      tags: data.tags,
      authorId: data.authorId,
      published: Boolean(data.published),
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
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
): Promise<KnowledgeArticle> {
  const now = new Date();
  const isUnique = await isKnowledgeSlugUnique(article.slug);
  if (!isUnique) {
    throw new Error('A knowledge article with this slug already exists.');
  }

  if (article.published && !canPublishKnowledgeArticle(article)) {
    throw new Error('Published content requires title, slug, and content.');
  }

  const docRef = await firestore.collection('knowledge_articles').add({
    ...article,
    featured: Boolean(article.featured),
    tags: article.tags ?? [],
    createdAt: now,
    updatedAt: now,
    publishedAt: article.published ? now : null,
  });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'knowledge_article' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'knowledge_article' });
  return normalizeKnowledgeArticle(docRef.id, {
    ...article,
    createdAt: now,
    updatedAt: now,
    publishedAt: article.published ? now : null,
  });
}

export async function updateKnowledgeArticle(
  id: string,
  data: Partial<Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>,
): Promise<KnowledgeArticle | null> {
  const ref = firestore.doc(`knowledge_articles/${id}`);
  const beforeSnapshot = await ref.get();
  if (!beforeSnapshot.exists) return null;

  const beforeData = beforeSnapshot.data() ?? {};
  const nextSlug = data.slug ?? beforeData.slug;
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

  await saveContentRevision({ contentType: 'knowledge_article', contentId: id, editorUserId: 'system-admin', previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'knowledge_article' });
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

export async function deleteKnowledgeArticle(id: string): Promise<boolean> {
  const ref = firestore.doc(`knowledge_articles/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'knowledge_article', contentId: id, editorUserId: 'system-admin', previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'knowledge_article' });
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
      imageUrl: data.imageUrl ?? undefined,
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
      expiresAt: data.expiresAt ? toIsoString(data.expiresAt) : null,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function createPartnerOffer(
  offer: Omit<PartnerOffer, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<PartnerOffer> {
  const now = new Date();
  const docRef = await firestore.collection('partner_offers').add({
    ...offer,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'partner_offer' });
  await safeLogAnalyticsEvent({ eventType: 'admin_publish_triggered', userRole: 'admin', targetId: docRef.id, targetType: 'partner_offer' });
  return { id: docRef.id, ...offer, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function updatePartnerOffer(
  id: string,
  data: Partial<Omit<PartnerOffer, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<PartnerOffer | null> {
  const ref = firestore.doc(`partner_offers/${id}`);
  const beforeSnapshot = await ref.get();
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const offer = snapshot.data();
  if (!offer) return null;

  await saveContentRevision({ contentType: 'partner_offer', contentId: id, editorUserId: 'system-admin', previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'partner_offer' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_updated', userRole: 'admin', targetId: id, targetType: 'partner_offer' });
  return {
    id: snapshot.id,
    title: offer.title,
    description: offer.description,
    link: offer.link,
    active: Boolean(offer.active),
    imageUrl: offer.imageUrl ?? undefined,
    displayOrder: typeof offer.displayOrder === 'number' ? offer.displayOrder : 0,
    expiresAt: offer.expiresAt ? toIsoString(offer.expiresAt) : null,
    createdAt: toIsoString(offer.createdAt),
    updatedAt: toIsoString(offer.updatedAt),
  };
}

export async function deletePartnerOffer(id: string): Promise<boolean> {
  const ref = firestore.doc(`partner_offers/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'partner_offer', contentId: id, editorUserId: 'system-admin', previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'partner_offer' });
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
): Promise<Testimonial> {
  const now = new Date();
  const docRef = await firestore.collection('testimonials').add({
    ...testimonial,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'testimonial' });
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
): Promise<Testimonial | null> {
  const ref = firestore.doc(`testimonials/${id}`);
  const beforeSnapshot = await ref.get();
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const testimonial = snapshot.data();
  if (!testimonial) return null;

  await saveContentRevision({ contentType: 'testimonial', contentId: id, editorUserId: 'system-admin', previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'testimonial' });
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

export async function deleteTestimonial(id: string): Promise<boolean> {
  const ref = firestore.doc(`testimonials/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'testimonial', contentId: id, editorUserId: 'system-admin', previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'testimonial' });
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
): Promise<PastProject> {
  const now = new Date();
  const docRef = await firestore.collection('past_projects').add({
    ...project,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_create', targetId: docRef.id, targetType: 'past_project' });
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
): Promise<PastProject | null> {
  const ref = firestore.doc(`past_projects/${id}`);
  const beforeSnapshot = await ref.get();
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const project = snapshot.data();
  if (!project) return null;

  await saveContentRevision({ contentType: 'past_project', contentId: id, editorUserId: 'system-admin', previousContent: beforeSnapshot.data() ?? null, currentContent: snapshot.data() ?? null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_update', targetId: id, targetType: 'past_project' });
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

export async function deletePastProject(id: string): Promise<boolean> {
  const ref = firestore.doc(`past_projects/${id}`);
  const before = await ref.get();
  await ref.delete();
  await saveContentRevision({ contentType: 'past_project', contentId: id, editorUserId: 'system-admin', previousContent: before.data() ?? null, currentContent: null });
  await logAuditEvent({ actorUserId: 'system-admin', actorRole: 'admin', actionType: 'admin_content_delete', targetId: id, targetType: 'past_project' });
  await safeLogAnalyticsEvent({ eventType: 'admin_content_deleted', userRole: 'admin', targetId: id, targetType: 'past_project' });
  return true;
}


export async function getActivePartnerOffers(): Promise<PartnerOffer[]> {
  const offers = await getPartnerOffers();
  return sortByDisplayOrderThenCreatedAt(
    offers.filter((offer) => offer.active && (!offer.expiresAt || new Date(offer.expiresAt).getTime() > Date.now())),
  );
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const testimonials = await getTestimonials();
  return sortByDisplayOrderThenCreatedAt(testimonials.filter((testimonial) => testimonial.active));
}

export async function getPublishedPastProjects(): Promise<PastProject[]> {
  const projects = await getPastProjects();
  return sortByDisplayOrderThenCreatedAt(projects.filter((project) => project.active));
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
    membershipTier: data.membershipTier ? String(data.membershipTier) : null,
    membershipStatus: String(data.membershipStatus ?? 'pending'),
    emailVerified: Boolean(data.emailVerified),
    lastLoginAt: data.lastLoginAt ? toIsoString(data.lastLoginAt) : null,
    accountStatus: data.accountStatus === 'suspended' ? 'suspended' : 'active',
    accessExpiry: data.accessExpiry ? toIsoString(data.accessExpiry) : null,
    squareCustomerId: data.squareCustomerId ? String(data.squareCustomerId) : null,
    squareSubscriptionId: data.squareSubscriptionId ? String(data.squareSubscriptionId) : null,
    lastPaymentStatus: data.lastPaymentStatus ? String(data.lastPaymentStatus) : null,
    lastPaymentAt: data.lastPaymentAt ? toIsoString(data.lastPaymentAt) : null,
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
  actorUserId = 'system-admin',
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

export async function updateUserRole(uid: string, role: string, actorUserId = 'system-admin'): Promise<UserProfile | null> {
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
  actorUserId = 'system-admin',
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
): Promise<UserProfile | null> {
  let next = await getUserById(uid);
  if (data.name) {
    next = await updateUserAdminFields(uid, { name: data.name });
  }
  if (!next) return null;

  if (data.role) {
    next = await updateUserRole(uid, data.role);
    if (!next) return null;
  }

  if (data.accountStatus) {
    next = await updateUserAccountStatus(uid, data.accountStatus);
    if (!next) return null;
  }

  if (data.membershipTier || data.membershipStatus) {
    const ref = firestore.doc(`users/${uid}`);
    await ref.update({ membershipTier: data.membershipTier ?? next.membershipTier ?? null, membershipStatus: data.membershipStatus ?? next.membershipStatus ?? 'pending', updatedAt: new Date() });
    next = await getUserById(uid);
  }

  return next;
}
