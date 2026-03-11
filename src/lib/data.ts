import { firestore } from '@/firebase/server';
import type {
  Document,
  DocumentSuite,
  KnowledgeArticle,
  MembershipPlan,
  PartnerOffer,
  PastProject,
  Testimonial,
} from './definitions';

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

export async function getDocumentSuites(): Promise<DocumentSuite[]> {
  const suitesSnapshot = await firestore.collection('documentation_suites').get();

  const suites = suitesSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.description,
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
      stripePriceId: data.stripePriceId,
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
  return { id: docRef.id, ...plan };
}

export async function updateMembershipPlan(
  id: string,
  data: Partial<Omit<MembershipPlan, 'id'>>,
): Promise<MembershipPlan | null> {
  const ref = firestore.doc(`membership_plans/${id}`);
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const plan = snapshot.data();
  if (!plan) return null;

  return {
    id: snapshot.id,
    name: plan.name,
    description: plan.description,
    currency: plan.currency,
    amount: plan.amount,
    interval: plan.interval,
    active: Boolean(plan.active),
    stripePriceId: plan.stripePriceId,
  };
}

export async function deleteMembershipPlan(id: string): Promise<boolean> {
  await firestore.doc(`membership_plans/${id}`).delete();
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
      tags: data.tags,
      authorId: data.authorId,
      published: Boolean(data.published),
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function createKnowledgeArticle(
  article: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<KnowledgeArticle> {
  const now = new Date();
  const docRef = await firestore.collection('knowledge_articles').add({
    ...article,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...article, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function updateKnowledgeArticle(
  id: string,
  data: Partial<Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<KnowledgeArticle | null> {
  const ref = firestore.doc(`knowledge_articles/${id}`);
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const article = snapshot.data();
  if (!article) return null;

  return {
    id: snapshot.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: article.tags,
    authorId: article.authorId,
    published: Boolean(article.published),
    createdAt: toIsoString(article.createdAt),
    updatedAt: toIsoString(article.updatedAt),
  };
}

export async function deleteKnowledgeArticle(id: string): Promise<boolean> {
  await firestore.doc(`knowledge_articles/${id}`).delete();
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
  return { id: docRef.id, ...offer, createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export async function updatePartnerOffer(
  id: string,
  data: Partial<Omit<PartnerOffer, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<PartnerOffer | null> {
  const ref = firestore.doc(`partner_offers/${id}`);
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const offer = snapshot.data();
  if (!offer) return null;

  return {
    id: snapshot.id,
    title: offer.title,
    description: offer.description,
    link: offer.link,
    active: Boolean(offer.active),
    createdAt: toIsoString(offer.createdAt),
    updatedAt: toIsoString(offer.updatedAt),
  };
}

export async function deletePartnerOffer(id: string): Promise<boolean> {
  await firestore.doc(`partner_offers/${id}`).delete();
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
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const testimonial = snapshot.data();
  if (!testimonial) return null;

  return {
    id: snapshot.id,
    clientName: testimonial.clientName,
    content: testimonial.content,
    role: testimonial.role,
    company: testimonial.company,
    createdAt: toIsoString(testimonial.createdAt),
    updatedAt: toIsoString(testimonial.updatedAt),
  };
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  await firestore.doc(`testimonials/${id}`).delete();
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
  await ref.update({ ...data, updatedAt: new Date() });
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const project = snapshot.data();
  if (!project) return null;

  return {
    id: snapshot.id,
    name: project.name,
    description: project.description,
    link: project.link,
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt),
  };
}

export async function deletePastProject(id: string): Promise<boolean> {
  await firestore.doc(`past_projects/${id}`).delete();
  return true;
}
