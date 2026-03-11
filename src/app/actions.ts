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
    revalidatePath('/docushare');
    return newDoc;
}

export async function updateDocument(id: string, data: Partial<Document>) {
    const updatedDoc = await dbUpdateDocument(id, data);
    revalidatePath('/admin/documents');
    revalidatePath('/docushare');
    return updatedDoc;
}

export async function deleteDocument(id: string, suiteId: string) {
    const success = await dbDeleteDocument(id, suiteId);
    revalidatePath('/admin/documents');
    revalidatePath('/docushare');
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
    revalidatePath('/docushare');
    return newSuite;
}

export async function updateSuite(id: string, data: Partial<Omit<DocumentSuite, 'id' | 'documents'>>) {
    const updatedSuite = await dbUpdateSuite(id, data);
    revalidatePath('/admin/suites');
    revalidatePath('/docushare');
    return updatedSuite;
}

export async function deleteSuite(id: string) {
    const success = await dbDeleteSuite(id);
    revalidatePath('/admin/suites');
    revalidatePath('/admin/documents');
    revalidatePath('/docushare');
    return success;
}

export async function sendContactMessage(formData: FormData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // In a real application, you would send this to your backend,
    // send an email, or save it to a database.
    console.log('Received contact form submission:');
    console.log({ name, email, message });

    // Simulate a delay
    await new Promise(res => setTimeout(res, 1000));

    // You can revalidate a path if you were storing messages and displaying them.
    // revalidatePath('/admin/messages');
    
    return { success: true, message: 'Your message has been sent successfully!' };
}
