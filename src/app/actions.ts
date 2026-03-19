'use server';

import '@/lib/server-only';

import { revalidatePath } from 'next/cache';
import {
  generateDocumentDescription as genDescription,
  type GenerateDocumentDescriptionInput,
} from '@/ai/flows/generate-document-description';
import {
  addDocument as dbAddDocument,
  updateDocument as dbUpdateDocument,
  deleteDocument as dbDeleteDocument,
  addSuite as dbAddSuite,
  updateSuite as dbUpdateSuite,
  deleteSuite as dbDeleteSuite,
} from '@/lib/data';
import type { Document, DocumentSuite } from '@/lib/definitions';
import { firestore } from '@/firebase/server';
import { triggerAdminAlert } from '@/lib/alerts';
import { sendTemplatedEmail } from '@/lib/email';
import { safeLogAnalyticsEvent } from '@/lib/analytics-server';
import { createNotification } from '@/lib/notifications';

async function notifyMembersOfNewResource(doc: Omit<Document, 'id' | 'createdAt'> & { id: string }) {
  if (process.env.EMAIL_RESOURCE_PUBLISH_ENABLED !== 'true') {
    return;
  }

  const members = await firestore
    .collection('users')
    .where('role', '==', 'member')
    .where('membershipStatus', '==', 'active')
    .limit(200)
    .get();

  await Promise.all(
    members.docs
      .map((userDoc) => ({ id: userDoc.id, email: String(userDoc.data().email ?? '').trim() }))
      .filter((member) => member.email)
      .map((member) =>
        sendTemplatedEmail({
          recipient: member.email,
          templateKey: 'new_resource_published',
          triggerSource: 'resource_published',
          relatedUserId: member.id,
          relatedEntityId: doc.id,
          relatedEntityType: 'documentation_resource',
          context: {
            resourceTitle: doc.name,
          },
        }),
      ),
  );
}

export async function addDocument(data: Omit<Document, 'id' | 'createdAt'>) {
  const newDoc = await dbAddDocument(data);

  await Promise.all([
    createNotification({
      audienceRole: 'member',
      audienceType: 'role',
      type: 'resource_published',
      title: 'New resource published',
      message: `${newDoc.name} is now available in Docushare.`,
      actionUrl: '/docushare',
      severity: 'info',
      metadata: { resourceId: newDoc.id },
    }),
    triggerAdminAlert({
      type: 'resource_published',
      title: 'Resource published',
      message: `${newDoc.name} was published to members.`,
      actionUrl: '/admin/documents',
    }),
    notifyMembersOfNewResource(newDoc),
  ]);

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

  const emailResult = await sendTemplatedEmail({
    recipient: process.env.ADMIN_ALERT_EMAIL ?? email,
    templateKey: 'admin_contact_alert',
    triggerSource: 'contact_enquiry',
    relatedEntityId: ref.id,
    relatedEntityType: 'contact_enquiry',
    context: {
      contactName: name,
      contactEmail: email,
      contactMessage: message,
    },
  });

  await Promise.all([
    safeLogAnalyticsEvent({
      eventType: 'contact_submitted',
      metadata: { enquiryId: ref.id, source, emailStatus: emailResult.status },
    }),
    triggerAdminAlert({
      type: 'new_contact_enquiry',
      title: 'New contact enquiry submitted',
      message: `${name} submitted a contact enquiry.`,
      actionUrl: '/admin/notifications',
    }),
    !emailResult.ok
      ? triggerAdminAlert({
          type: 'failed_email_send',
          title: 'Contact alert email failed',
          message: `Enquiry ${ref.id}: ${emailResult.reason}`,
          actionUrl: '/admin/notifications',
        })
      : Promise.resolve(),
  ]);

  return { success: true, message: 'Your message has been sent successfully!' };
}
