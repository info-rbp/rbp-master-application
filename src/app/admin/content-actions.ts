'use server';

import { revalidatePath } from 'next/cache';
import {
  createKnowledgeArticle,
  createPartnerOffer,
  createPastProject,
  createTestimonial,
  deleteKnowledgeArticle,
  deletePartnerOffer,
  deletePastProject,
  deleteTestimonial,
  updateKnowledgeArticle,
  updatePartnerOffer,
  updatePastProject,
  updateTestimonial,
} from '@/lib/data';
import type { KnowledgeArticle, PartnerOffer, PastProject, Testimonial } from '@/lib/definitions';

export async function savePartnerOffer(input: Partial<PartnerOffer> & Pick<PartnerOffer, 'title' | 'description' | 'link'>) {
  if (input.id) {
    return updatePartnerOffer(input.id, input);
  }
  return createPartnerOffer({
    title: input.title,
    description: input.description,
    link: input.link,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
    expiresAt: input.expiresAt ?? null,
  });
}

export async function removePartnerOffer(id: string) {
  await deletePartnerOffer(id);
}

export async function saveTestimonial(input: Partial<Testimonial> & Pick<Testimonial, 'clientName' | 'content'>) {
  if (input.id) return updateTestimonial(input.id, input);
  return createTestimonial({
    clientName: input.clientName,
    content: input.content,
    role: input.role,
    company: input.company,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
  });
}

export async function removeTestimonial(id: string) {
  await deleteTestimonial(id);
}

export async function savePastProject(input: Partial<PastProject> & Pick<PastProject, 'name' | 'description'>) {
  if (input.id) return updatePastProject(input.id, input);
  return createPastProject({
    name: input.name,
    description: input.description,
    link: input.link,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
  });
}

export async function removePastProject(id: string) {
  await deletePastProject(id);
}

export async function saveKnowledgeArticle(input: Partial<KnowledgeArticle> & Pick<KnowledgeArticle, 'title' | 'slug' | 'content'>) {
  if (input.id) return updateKnowledgeArticle(input.id, input);
  return createKnowledgeArticle({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    category: input.category,
    contentType: input.contentType,
    tags: input.tags,
    authorId: input.authorId,
    published: input.published ?? false,
  });
}

export async function removeKnowledgeArticle(id: string) {
  await deleteKnowledgeArticle(id);
}


export async function revalidateAdminPath(path: string) {
  revalidatePath(path);
}
