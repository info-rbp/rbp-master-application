import { NextRequest, NextResponse } from 'next/server';
import {
  deleteKnowledgeArticle,
  publishKnowledgeArticle,
  unpublishKnowledgeArticle,
  updateKnowledgeArticle,
} from '@/lib/data';
import { AuthorizationError, requireAdminRequestContext } from '@/lib/server-auth';
import { normalizeKnowledgeSlug, parseTagInput } from '@/lib/knowledge-center';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let auth;
  try {
    auth = await requireAdminRequestContext(request);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { id } = await context.params;
  const payload = await request.json();

  const article = await updateKnowledgeArticle(id, {
    title: payload.title !== undefined ? String(payload.title ?? '').trim() : undefined,
    slug: payload.slug !== undefined ? normalizeKnowledgeSlug(String(payload.slug ?? '')) : undefined,
    excerpt: payload.excerpt !== undefined ? String(payload.excerpt ?? '').trim() : undefined,
    content: payload.content !== undefined ? String(payload.content ?? '').trim() : undefined,
    tags: payload.tags !== undefined ? (Array.isArray(payload.tags) ? payload.tags : parseTagInput(String(payload.tags ?? ''))) : undefined,
    published: payload.published !== undefined ? Boolean(payload.published) : undefined,
    featured: payload.featured !== undefined ? Boolean(payload.featured) : undefined,
    imageUrl: payload.imageUrl !== undefined ? String(payload.imageUrl ?? '').trim() : undefined,
    seoTitle: payload.seoTitle !== undefined ? String(payload.seoTitle ?? '').trim() : undefined,
    seoDescription: payload.seoDescription !== undefined ? String(payload.seoDescription ?? '').trim() : undefined,
    externalLink: payload.externalLink !== undefined ? String(payload.externalLink ?? '').trim() : undefined,
    ctaLabel: payload.ctaLabel !== undefined ? String(payload.ctaLabel ?? '').trim() : undefined,
    authorName: payload.authorName !== undefined ? String(payload.authorName ?? '').trim() : undefined,
  }, auth.userId);

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: article });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let auth;
  try {
    auth = await requireAdminRequestContext(request);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { id } = await context.params;
  const payload = await request.json();
  const article = payload.action === 'publish'
    ? await publishKnowledgeArticle(id, auth.userId)
    : await unpublishKnowledgeArticle(id, auth.userId);

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: article });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let auth;
  try {
    auth = await requireAdminRequestContext(request);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 401;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }, { status });
  }

  const { id } = await context.params;
  await deleteKnowledgeArticle(id, auth.userId);
  return NextResponse.json({ ok: true });
}
