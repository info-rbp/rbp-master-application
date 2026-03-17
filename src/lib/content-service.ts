
import { firestore } from '@/firebase/server';

export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface Content {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  authorId: string;
  reviewerId?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

const db = firestore;
const contentCollection = db.collection('content');

/**
 * Creates a new content draft.
 */
export async function createContentDraft(authorId: string, title: string, body: string): Promise<Content> {
  const id = db.collection('_').doc().id;
  const now = new Date().toISOString();

  const content: Content = {
    id,
    title,
    body,
    status: 'draft',
    authorId,
    createdAt: now,
    updatedAt: now,
  };

  await contentCollection.doc(id).set(content);
  return content;
}

/**
 * Submits a content draft for review.
 */
export async function submitForReview(contentId: string): Promise<Content> {
  const contentRef = contentCollection.doc(contentId);
  await contentRef.update({ status: 'pending_review', updatedAt: new Date().toISOString() });
  const doc = await contentRef.get();
  return doc.data() as Content;
}

/**
 * Approves content and marks it as published.
 */
export async function approveContent(contentId: string, reviewerId: string): Promise<Content> {
  const contentRef = contentCollection.doc(contentId);
  await contentRef.update({ 
    status: 'published', 
    reviewerId, 
    updatedAt: new Date().toISOString() 
  });
  const doc = await contentRef.get();
  return doc.data() as Content;
}

/**
 * Rejects content and provides feedback.
 */
export async function rejectContent(contentId: string, reviewerId: string, feedback: string): Promise<Content> {
  const contentRef = contentCollection.doc(contentId);
  await contentRef.update({ 
    status: 'rejected', 
    reviewerId, 
    feedback, 
    updatedAt: new Date().toISOString() 
  });
  const doc = await contentRef.get();
  return doc.data() as Content;
}
