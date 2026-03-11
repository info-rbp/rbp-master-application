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
import { firestore } from '@/firebase/server';
import { triggerAdminAlert } from '@/lib/alerts';
import { sendTemplatedEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';

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

export async function sendContactMessage(_prevState: { success: boolean; message: string }, formData: FormData) {
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const source = String(formData.get('source') ?? 'website');

    if (!name || !email || !message) {
      return { success: false, message: 'Please complete all fields before submitting.' };
    }

    const ref = await firestore.collection('contact_enquiries').add({
      name,
      email,
      message,
      source,
      status: 'new',
      createdAt: new Date(),
    });

    await Promise.all([
      trackEvent({
        eventType: 'contact_enquiry_submitted',
        metadata: { enquiryId: ref.id, source },
      }),
      triggerAdminAlert({
        type: 'enquiry',
        title: 'New contact enquiry submitted',
        message: `${name} submitted a contact enquiry.`,
        actionUrl: '/admin/notifications',
      }),
      sendTemplatedEmail({
        recipient: process.env.ADMIN_ALERT_EMAIL ?? email,
        templateKey: 'admin_contact_alert',
        context: {
          contactName: name,
          contactEmail: email,
          contactMessage: message,
        },
      }),
    ]);

    return { success: true, message: 'Your message has been sent successfully!' };
}
