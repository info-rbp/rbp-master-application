'use server';

import { db } from '@/firebase/server';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface Resource {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'published';
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    createdAt: Date;
}

export async function getResources(): Promise<Resource[]> {
    const querySnapshot = await getDocs(collection(db, 'resources'));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as Resource[];
}

export async function createResource(data: Omit<Resource, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'resources'), {
        ...data,
        createdAt: new Date(),
    });
    revalidatePath('/admin/resources');
}

export async function updateResource(id: string, data: Partial<Omit<Resource, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, 'resources', id), data);
    revalidatePath('/admin/resources');
}

export async function deleteResource(id: string) {
    await deleteDoc(doc(db, 'resources', id));
    revalidatePath('/admin/resources');
}
