'use server';

import { revalidatePath } from 'next/cache';
import { generateDocumentDescription as genDescription, type GenerateDocumentDescriptionInput } from '@/ai/flows/generate-document-description';
import { 
    addDocument as dbAddDocument, 
    updateDocument as dbUpdateDocument, 
    deleteDocument as dbDeleteDocument, 
    addSuite as dbAddSuite,
    updateSuite as dbUpdateSuite,
    deleteSuite as dbDeleteSuite
} from '@/lib/data';
import type { Document, DocumentSuite } from '@/lib/definitions';

export async function addDocument(data: Omit<Document, 'id' | 'createdAt'>) {
    const newDoc = await dbAddDocument(data);
    revalidatePath('/admin/documents');
    revalidatePath('/');
    return newDoc;
}

export async function updateDocument(id: string, data: Partial<Document>) {
    const updatedDoc = await dbUpdateDocument(id, data);
    revalidatePath('/admin/documents');
    revalidatePath('/');
    return updatedDoc;
}

export async function deleteDocument(id: string, suiteId: string) {
    const success = await dbDeleteDocument(id, suiteId);
    revalidatePath('/admin/documents');
    revalidatePath('/');
    return success;
}

export async function generateDescriptionForDocument(input: GenerateDocumentDescriptionInput) {
  try {
    const description = await genDescription(input);
    return { success: true, description };
  } catch (error) {
    console.error('Error generating document description:', error);
    return { success: false, error: 'An error occurred while generating the description.' };
  }
}

export async function addSuite(data: Omit<DocumentSuite, 'id' | 'documents'>) {
    const newSuite = await dbAddSuite(data);
    revalidatePath('/admin/suites');
    revalidatePath('/');
    return newSuite;
}

export async function updateSuite(id: string, data: Partial<Omit<DocumentSuite, 'id' | 'documents'>>) {
    const updatedSuite = await dbUpdateSuite(id, data);
    revalidatePath('/admin/suites');
    revalidatePath('/');
    return updatedSuite;
}

export async function deleteSuite(id: string) {
    const success = await dbDeleteSuite(id);
    revalidatePath('/admin/suites');
    revalidatePath('/admin/documents');
    revalidatePath('/');
    return success;
}