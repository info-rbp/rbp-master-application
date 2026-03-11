import type { Document, DocumentSuite } from './definitions';
import { initializeFirebase } from '@/firebase';
import { 
    collection, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    Timestamp, 
    query, 
    orderBy,
    collectionGroup,
    writeBatch,
    getDoc
} from 'firebase/firestore';

const { firestore } = initializeFirebase();

export async function getDocumentSuites(): Promise<DocumentSuite[]> {
  const suitesCollection = collection(firestore, 'documentation_suites');
  const suitesSnapshot = await getDocs(query(suitesCollection));
  
  const suites = suitesSnapshot.docs.map(d => {
      const data = d.data();
      return { 
          id: d.id, 
          name: data.name,
          description: data.description,
      } as Omit<DocumentSuite, 'documents'>
  });

  const docsQuery = query(collectionGroup(firestore, 'documents'), orderBy('uploadedAt', 'desc'));
  const docsSnapshot = await getDocs(docsQuery);
  const allDocuments = docsSnapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        description: data.aiGeneratedDescription,
        url: data.externalUrl || '#',
        type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
        createdAt: (data.uploadedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
        suiteId: data.documentationSuiteId,
      } as Document
  });

  return suites.map(suite => ({
      ...suite,
      documents: allDocuments.filter(doc => doc.suiteId === suite.id)
  }));
}

export async function getAllDocuments(): Promise<Document[]> {
    const docsQuery = query(collectionGroup(firestore, 'documents'), orderBy('uploadedAt', 'desc'));
    const docsSnapshot = await getDocs(docsQuery);
    return docsSnapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            name: data.name,
            description: data.aiGeneratedDescription,
            url: data.externalUrl || '#',
            type: data.sourceType === 'googleDrive' ? 'drive' : 'file',
            createdAt: (data.uploadedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
            suiteId: data.documentationSuiteId,
        } as Document
    });
}

export async function getSuites(): Promise<Omit<DocumentSuite, 'documents'>[]> {
  const suitesCollection = collection(firestore, 'documentation_suites');
  const suitesSnapshot = await getDocs(query(suitesCollection));
  return suitesSnapshot.docs.map(d => {
      const data = d.data();
      return { 
          id: d.id, 
          name: data.name,
          description: data.description
      }
  });
}

export async function addDocument(docData: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    const { suiteId, name, description, url, type } = docData;
    const docsCollection = collection(firestore, `documentation_suites/${suiteId}/documents`);
    
    const newDocData = {
        name,
        aiGeneratedDescription: description,
        sourceType: type === 'drive' ? 'googleDrive' : 'upload',
        externalUrl: type === 'drive' ? url : '',
        storagePath: type === 'file' ? url : '', // Assuming URL is path for file
        fileType: 'unknown', // This would need to be determined from the file
        fileSize: 0, // This would need to be determined from the file
        downloadCount: 0,
        uploadedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        documentationSuiteId: suiteId,
    };
    
    const docRef = await addDoc(docsCollection, newDocData);

    return {
        id: docRef.id,
        ...docData,
        createdAt: (newDocData.uploadedAt as Timestamp).toDate().toISOString(),
    };
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<Document | null> {
    if (!data.suiteId) throw new Error("suiteId is required for updating a document");
    const docRef = doc(firestore, `documentation_suites/${data.suiteId}/documents`, id);
    
    const updateData: {[key: string]: any} = { updatedAt: Timestamp.now() };
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.aiGeneratedDescription = data.description;
    if (data.url) {
        if(data.type === 'drive') updateData.externalUrl = data.url;
        else updateData.storagePath = data.url;
    }
    if (data.type) updateData.sourceType = data.type === 'drive' ? 'googleDrive' : 'upload';
    if (data.suiteId) updateData.documentationSuiteId = data.suiteId;

    await updateDoc(docRef, updateData);
    
    const updatedDocSnap = await getDoc(docRef);
    if (!updatedDocSnap.exists()) return null;

    const docSnapData = updatedDocSnap.data();
    return {
        id: updatedDocSnap.id,
        name: docSnapData.name,
        description: docSnapData.aiGeneratedDescription,
        url: docSnapData.externalUrl || '#',
        type: docSnapData.sourceType === 'googleDrive' ? 'drive' : 'file',
        createdAt: (docSnapData.uploadedAt as Timestamp).toDate().toISOString(),
        suiteId: docSnapData.documentationSuiteId,
    };
}

export async function deleteDocument(id: string, suiteId: string): Promise<boolean> {
    if (!suiteId) return false;
    const docRef = doc(firestore, `documentation_suites/${suiteId}/documents`, id);
    await deleteDoc(docRef);
    return true;
}

export async function addSuite(suite: Omit<DocumentSuite, 'id' | 'documents'>): Promise<Omit<DocumentSuite, 'documents'>> {
    const newSuiteData = {
        ...suite,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    }
    const docRef = await addDoc(collection(firestore, 'documentation_suites'), newSuiteData);
    return {
        id: docRef.id,
        ...suite
    };
}

export async function updateSuite(id: string, data: Partial<Omit<DocumentSuite, 'id' | 'documents'>>): Promise<Omit<DocumentSuite, 'documents'> | null> {
    const suiteRef = doc(firestore, 'documentation_suites', id);
    await updateDoc(suiteRef, { ...data, updatedAt: Timestamp.now() });

    const updatedDocSnap = await getDoc(suiteRef);
    if (!updatedDocSnap.exists()) return null;

    const docData = updatedDocSnap.data();
    return {
        id: updatedDocSnap.id,
        name: docData.name,
        description: docData.description,
    };
}

export async function deleteSuite(id: string): Promise<boolean> {
    const suiteRef = doc(firestore, 'documentation_suites', id);
    const docsCollectionRef = collection(firestore, `documentation_suites/${id}/documents`);
    
    const batch = writeBatch(firestore);
    
    const docsSnapshot = await getDocs(docsCollectionRef);
    docsSnapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    
    batch.delete(suiteRef);
    
    await batch.commit();
    return true;
}