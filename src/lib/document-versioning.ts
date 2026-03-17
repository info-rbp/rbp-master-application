
import { firestore } from '@/firebase/server';
import { generatePdfDocument } from './document-generation';

export interface Document {
  id: string;
  userId: string;
  templateId: string;
  createdAt: string;
  latestVersion: number;
}

export interface DocumentVersion {
  version: number;
  createdAt: string;
  data: Record<string, any>;
  storagePath: string;
}

const db = firestore;

/**
 * Creates a new document with its first version.
 * @param userId The ID of the user creating the document.
 * @param templateId The ID of the template to use.
 * @param data The data to populate the template with.
 * @returns The newly created document.
 */
export async function createVersionedDocument(userId: string, templateId: string, data: Record<string, any>): Promise<Document> {
  const documentRef = db.collection('documents').doc();
  const version = 1;
  const now = new Date().toISOString();

  const pdfBuffer = await generatePdfDocument(templateId, data);
  const storagePath = `documents/${documentRef.id}/version-${version}.pdf`;
  // In a real application, you would upload the pdfBuffer to a storage service like Google Cloud Storage
  // and save the path in the storagePath variable.
  // For this example, we'll just store the path.

  const document: Document = {
    id: documentRef.id,
    userId,
    templateId,
    createdAt: now,
    latestVersion: version,
  };

  const documentVersion: DocumentVersion = {
    version,
    createdAt: now,
    data,
    storagePath,
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(documentRef, document);
    const versionRef = documentRef.collection('versions').doc(version.toString());
    transaction.set(versionRef, documentVersion);
  });

  return document;
}

/**
 * Regenerates a document with new data, creating a new version.
 * @param documentId The ID of the document to regenerate.
 * @param data The new data to use for generation.
 * @returns The updated document.
 */
export async function regenerateDocument(documentId: string, data: Record<string, any>): Promise<Document> {
  const documentRef = db.collection('documents').doc(documentId);
  const documentDoc = await documentRef.get();

  if (!documentDoc.exists) {
    throw new Error('Document not found');
  }

  const document = documentDoc.data() as Document;
  const newVersion = document.latestVersion + 1;
  const now = new Date().toISOString();

  const pdfBuffer = await generatePdfDocument(document.templateId, data);
  const storagePath = `documents/${documentId}/version-${newVersion}.pdf`;
  // Again, in a real app, you would upload this to a storage service.

  const newDocumentVersion: DocumentVersion = {
    version: newVersion,
    createdAt: now,
    data,
    storagePath,
  };

  await db.runTransaction(async (transaction) => {
    transaction.update(documentRef, { latestVersion: newVersion });
    const versionRef = documentRef.collection('versions').doc(newVersion.toString());
    transaction.set(versionRef, newDocumentVersion);
  });

  return { ...document, latestVersion: newVersion };
}

/**
 * Retrieves a document and all its versions.
 * @param documentId The ID of the document to retrieve.
 * @returns The document with an array of its versions.
 */
export async function getDocumentWithVersions(documentId: string): Promise<(Document & { versions: DocumentVersion[] }) | null> {
  const documentRef = db.collection('documents').doc(documentId);
  const documentDoc = await documentRef.get();

  if (!documentDoc.exists) {
    return null;
  }

  const document = documentDoc.data() as Document;
  const versionsSnapshot = await documentRef.collection('versions').orderBy('version', 'desc').get();
  const versions = versionsSnapshot.docs.map(doc => doc.data() as DocumentVersion);

  return { ...document, versions };
}
