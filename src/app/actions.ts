'use server';

import { revalidatePath } from 'next/cache';
import { generateDocumentDescription as genDescription, type GenerateDocumentDescriptionInput } from '@/ai/flows/generate-document-description';
import { addDocument as dbAddDocument, updateDocument as dbUpdateDocument, deleteDocument as dbDeleteDocument } from '@/lib/data';
import type { Document } from '@/lib/definitions';

export async function addDocument(data: Omit<Document, 'id' | 'createdAt'>) {
    const newDoc = await dbAddDocument(data);
    revalidatePath('/admin');
    revalidatePath('/');
    return newDoc;
}

export async function updateDocument(id: string, data: Partial<Document>) {
    const updatedDoc = await dbUpdateDocument(id, data);
    revalidatePath('/admin');
    revalidatePath('/');
    return updatedDoc;
}

export async function deleteDocument(id: string) {
    const success = await dbDeleteDocument(id);
    revalidatePath('/admin');
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
