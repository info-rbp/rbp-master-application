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
import { requireAdminServerContext } from '@/lib/server-auth';

export async function savePartnerOffer(input: Partial<PartnerOffer> & Pick<PartnerOffer, 'title' | 'description' | 'link'>) {
  const auth = await requireAdminServerContext();
  if (input.id) {
    return updatePartnerOffer(input.id, input, auth.userId);
  }
  return createPartnerOffer({
    title: input.title,
    description: input.description,
    link: input.link,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
    expiresAt: input.expiresAt ?? null,
  }, auth.userId);
}

export async function removePartnerOffer(id: string) {
  const auth = await requireAdminServerContext();
  await deletePartnerOffer(id, auth.userId);
}

export async function saveTestimonial(input: Partial<Testimonial> & Pick<Testimonial, 'clientName' | 'content'>) {
  const auth = await requireAdminServerContext();
  if (input.id) return updateTestimonial(input.id, input, auth.userId);
  return createTestimonial({
    clientName: input.clientName,
    content: input.content,
    role: input.role,
    company: input.company,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
  }, auth.userId);
}

export async function removeTestimonial(id: string) {
  const auth = await requireAdminServerContext();
  await deleteTestimonial(id, auth.userId);
}

export async function savePastProject(input: Partial<PastProject> & Pick<PastProject, 'name' | 'description'>) {
  const auth = await requireAdminServerContext();
  if (input.id) return updatePastProject(input.id, input, auth.userId);
  return createPastProject({
    name: input.name,
    description: input.description,
    link: input.link,
    active: input.active ?? true,
    imageUrl: input.imageUrl,
    displayOrder: input.displayOrder ?? 0,
  }, auth.userId);
}

export async function removePastProject(id: string) {
  const auth = await requireAdminServerContext();
  await deletePastProject(id, auth.userId);
}

export async function saveKnowledgeArticle(input: Partial<KnowledgeArticle> & Pick<KnowledgeArticle, 'title' | 'slug' | 'content'>) {
  const auth = await requireAdminServerContext();
  if (input.id) return updateKnowledgeArticle(input.id, input, auth.userId);
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
  }, auth.userId);
}

export async function removeKnowledgeArticle(id: string) {
  const auth = await requireAdminServerContext();
  await deleteKnowledgeArticle(id, auth.userId);
}


export async function revalidateAdminPath(path: string) {
  await requireAdminServerContext();
  revalidatePath(path);
}
